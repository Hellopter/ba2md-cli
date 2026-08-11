import path from 'node:path';
import { CliError } from '../errors.js';
import { REQUIREMENTS_DIR, SOURCES_DIR, WIKI_DIR, toPosix } from './paths.js';

const SAFE_ID_RE = /^[a-zA-Z0-9._-]+$/;
const SAFE_REQUIREMENT_KEY_RE = /^[a-zA-Z0-9._-]+\.md$/;

export function isSafeResourceId(id: string): boolean {
  return SAFE_ID_RE.test(id) && id !== '.' && id !== '..';
}

export function isSafeRequirementKey(name: string): boolean {
  return SAFE_REQUIREMENT_KEY_RE.test(name) && !name.includes('/') && !name.includes('\\');
}

export function expectedSourcePath(id: string): string {
  return toPosix(path.join(SOURCES_DIR, id));
}

export function expectedWikiPath(id: string): string {
  return toPosix(path.join(WIKI_DIR, id));
}

export function expectedRequirementPath(name: string): string {
  return toPosix(path.join(REQUIREMENTS_DIR, name));
}

/**
 * Normalize a workspace-relative path to posix form and reject escapes.
 * Does not touch the filesystem.
 */
export function normalizeWorkspaceRelativePath(relativePath: string): string {
  if (typeof relativePath !== 'string' || relativePath.length === 0) {
    throw new CliError('Workspace path must be a non-empty relative path');
  }

  if (path.isAbsolute(relativePath)) {
    throw new CliError(`Workspace path must be relative, got absolute: ${relativePath}`);
  }

  // Reject Windows drive-qualified and UNC-looking values on all platforms.
  if (/^[a-zA-Z]:[\\/]/.test(relativePath) || relativePath.startsWith('\\\\')) {
    throw new CliError(`Workspace path must be relative, got absolute: ${relativePath}`);
  }

  const posix = toPosix(relativePath);
  if (posix.startsWith('/') || posix.includes('\0')) {
    throw new CliError(`Invalid workspace path: ${relativePath}`);
  }

  const segments = posix.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new CliError(`Workspace path must not contain empty, '.', or '..' segments: ${relativePath}`);
  }

  return segments.join('/');
}

/**
 * Resolve a workspace-relative path to an absolute path strictly inside workspaceRoot.
 */
export function resolveWorkspacePath(workspaceRoot: string, relativePath: string): string {
  const normalized = normalizeWorkspaceRelativePath(relativePath);
  const root = path.resolve(workspaceRoot);
  const resolved = path.resolve(root, ...normalized.split('/'));
  const relative = path.relative(root, resolved);

  if (
    relative === '' ||
    relative.startsWith(`..${path.sep}`) ||
    relative === '..' ||
    path.isAbsolute(relative)
  ) {
    // relative === '' would be the root itself; managed entries must be nested.
    if (relative === '') {
      throw new CliError('Workspace path must point inside the workspace, not the root itself');
    }
    throw new CliError(`Workspace path escapes workspace root: ${relativePath}`);
  }

  // Defense in depth: resolved must be root + separator + rest.
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new CliError(`Workspace path escapes workspace root: ${relativePath}`);
  }

  return resolved;
}

export function resolveSourcePath(workspaceRoot: string, id: string): string {
  if (!isSafeResourceId(id)) {
    throw new CliError(`Invalid source id: ${id}`);
  }
  return resolveWorkspacePath(workspaceRoot, expectedSourcePath(id));
}

export function resolveWikiPath(workspaceRoot: string, id: string): string {
  if (!isSafeResourceId(id)) {
    throw new CliError(`Invalid wiki id: ${id}`);
  }
  return resolveWorkspacePath(workspaceRoot, expectedWikiPath(id));
}

export function resolveRequirementPath(workspaceRoot: string, name: string): string {
  if (!isSafeRequirementKey(name)) {
    throw new CliError(`Invalid requirement name: ${name}`);
  }
  return resolveWorkspacePath(workspaceRoot, expectedRequirementPath(name));
}
