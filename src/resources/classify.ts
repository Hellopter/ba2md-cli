import path from 'node:path';
import { pathExists, isDirectory } from '../utils/fs.js';

export type LocatorKind = 'local' | 'git';

export interface ClassifiedLocator {
  kind: LocatorKind;
  raw: string;
  /** Absolute local path when kind is local; original URL when kind is git. */
  resolved: string;
}

const GIT_URL_RE =
  /^(?:git@[^\s:]+:|https?:\/\/|ssh:\/\/|git:\/\/|file:\/\/)/i;

export function looksLikeGitUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (GIT_URL_RE.test(trimmed)) {
    return true;
  }
  // scp-like without scheme already covered by git@; bare host:path is ambiguous — treat as local if exists.
  return false;
}

/**
 * Classify a user locator. Local paths take precedence when they exist on disk.
 */
export async function classifyLocator(
  input: string,
  cwd: string = process.cwd(),
): Promise<ClassifiedLocator> {
  const raw = input.trim();
  if (!raw) {
    throw new Error('Locator must not be empty');
  }

  const absoluteCandidate = path.isAbsolute(raw) ? raw : path.resolve(cwd, raw);

  if (await pathExists(absoluteCandidate)) {
    return {
      kind: 'local',
      raw,
      resolved: absoluteCandidate,
    };
  }

  if (looksLikeGitUrl(raw)) {
    return {
      kind: 'git',
      raw,
      resolved: raw,
    };
  }

  // Non-existent local path that does not look like git.
  return {
    kind: 'local',
    raw,
    resolved: absoluteCandidate,
  };
}

export async function requireLocalDirectory(locator: ClassifiedLocator): Promise<string> {
  if (locator.kind !== 'local') {
    throw new Error('Expected a local directory');
  }
  if (!(await isDirectory(locator.resolved))) {
    throw new Error(`Not a directory: ${locator.resolved}`);
  }
  return locator.resolved;
}
