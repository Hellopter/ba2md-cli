import path from 'node:path';
import { CliError } from '../errors.js';
import { ensureDir, pathExists } from '../utils/fs.js';
import {
  BA2MD_DIR,
  PRODUCT_DIR,
  REQUIREMENTS_DIR,
  SOURCES_DIR,
  WIKI_DIR,
  WORKSPACE_CONFIG,
} from '../utils/paths.js';
import { installSkill } from '../skill/install.js';
import { configPath, readWorkspaceConfig, writeWorkspaceConfig } from './config.js';
import { emptyWorkspaceConfig } from './schema.js';

export interface InitResult {
  root: string;
  created: boolean;
  skillInstalled: boolean;
}

const WORKSPACE_DIRS = [
  REQUIREMENTS_DIR,
  SOURCES_DIR,
  WIKI_DIR,
  PRODUCT_DIR,
  BA2MD_DIR,
] as const;

export async function initWorkspace(
  name: string,
  cwd: string = process.cwd(),
): Promise<InitResult> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.includes('/') || trimmed.includes('\\') || trimmed === '.' || trimmed === '..') {
    throw new CliError('init name must be a single directory segment');
  }

  const root = path.resolve(cwd, trimmed);
  const configFile = configPath(root);
  const alreadyExists = await pathExists(configFile);

  if (alreadyExists) {
    // Non-destructive re-init: validate config, ensure dirs, ownership-aware skill install.
    // Drifted/unmanaged Skill targets are refused without modification.
    await readWorkspaceConfig(root);
    for (const dir of WORKSPACE_DIRS) {
      await ensureDir(path.join(root, dir));
    }
    await installSkill(root, { mode: 'install' });
    return {
      root,
      created: false,
      skillInstalled: true,
    };
  }

  await ensureDir(root);
  for (const dir of WORKSPACE_DIRS) {
    await ensureDir(path.join(root, dir));
  }

  const config = emptyWorkspaceConfig(trimmed);
  await writeWorkspaceConfig(root, config);
  await installSkill(root);

  return {
    root,
    created: true,
    skillInstalled: true,
  };
}

export function describeInit(result: InitResult): string {
  const rel = result.root;
  if (result.created) {
    return `Initialized ba2md workspace at ${rel}\nCreated ${WORKSPACE_CONFIG}, resource directories, and installed Skill.`;
  }
  return `Workspace already exists at ${rel}\nEnsured directories and refreshed owned Skill installs when safe (resources and drifted/unmanaged Skills preserved).`;
}
