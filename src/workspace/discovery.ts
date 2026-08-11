import fsp from 'node:fs/promises';
import path from 'node:path';
import { CliError } from '../errors.js';
import { pathExists } from '../utils/fs.js';
import { WORKSPACE_CONFIG } from '../utils/paths.js';
import { readWorkspaceConfig } from './config.js';
import type { WorkspaceConfig } from './schema.js';

export interface WorkspaceContext {
  root: string;
  config: WorkspaceConfig;
}

export async function findWorkspaceRoot(startDir: string = process.cwd()): Promise<string | null> {
  let current = path.resolve(startDir);

  while (true) {
    const candidate = path.join(current, WORKSPACE_CONFIG);
    if (await pathExists(candidate)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

export async function requireWorkspace(startDir: string = process.cwd()): Promise<WorkspaceContext> {
  const root = await findWorkspaceRoot(startDir);
  if (!root) {
    throw new CliError(
      `No ${WORKSPACE_CONFIG} found from ${path.resolve(startDir)}. Run this command inside a ba2md workspace or create one with \`ba2md init <name>\`.`,
    );
  }

  const config = await readWorkspaceConfig(root);
  return { root, config };
}

export async function assertNotInsideWorkspaceChild(targetDir: string): Promise<void> {
  // Soft check: if target already has workspace.yaml it is fine for re-init.
  const existing = path.join(targetDir, WORKSPACE_CONFIG);
  try {
    await fsp.access(existing);
  } catch {
    // no-op
  }
}
