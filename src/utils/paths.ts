import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const WORKSPACE_CONFIG = 'workspace.yaml';
export const BA2MD_DIR = '.ba2md';
export const RUNTIME_FILE = 'runtime.json';
export const SOURCES_DIR = 'sources';
export const WIKI_DIR = 'wiki';
export const REQUIREMENTS_DIR = 'requirements';
export const PRODUCT_DIR = 'product';
export const AGENTS_SKILL_DIR = path.join('.agents', 'skills', 'ba2md');
export const CLAUDE_SKILL_DIR = path.join('.claude', 'skills', 'ba2md');

export function packageRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  // dist/utils -> package root; src/utils when running via ts-node-like paths still resolves to parent of src/dist
  return path.resolve(here, '..', '..');
}

export function packagedSkillRoot(): string {
  return path.join(packageRoot(), 'skill', 'ba2md');
}

export function runtimePath(workspaceRoot: string): string {
  return path.join(workspaceRoot, BA2MD_DIR, RUNTIME_FILE);
}

export function toPosix(relativePath: string): string {
  return relativePath.split(path.sep).join('/');
}

export function sanitizeId(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/\.git$/i, '')
    .replace(/[\\/]+$/g, '')
    .split(/[\\/]/)
    .filter(Boolean)
    .pop();

  if (!cleaned) {
    throw new Error('Unable to infer a resource id');
  }

  const id = cleaned
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!id) {
    throw new Error(`Unable to sanitize resource id from "${raw}"`);
  }

  return id;
}
