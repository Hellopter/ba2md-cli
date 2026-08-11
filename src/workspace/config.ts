import fsp from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { CliError } from '../errors.js';
import { writeFileAtomic } from '../utils/fs.js';
import { WORKSPACE_CONFIG } from '../utils/paths.js';
import {
  WorkspaceConfig,
  WorkspaceConfigSchema,
} from './schema.js';

export function configPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, WORKSPACE_CONFIG);
}

export async function readWorkspaceConfig(workspaceRoot: string): Promise<WorkspaceConfig> {
  const filePath = configPath(workspaceRoot);
  let raw: string;
  try {
    raw = await fsp.readFile(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new CliError(`workspace.yaml not found at ${filePath}`);
    }
    throw error;
  }

  let parsed: unknown;
  try {
    parsed = YAML.parse(raw);
  } catch (error) {
    throw new CliError(`Invalid YAML in workspace.yaml: ${(error as Error).message}`);
  }

  const result = WorkspaceConfigSchema.safeParse(parsed);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new CliError(`Invalid workspace.yaml schema: ${detail}`);
  }

  return result.data;
}

export async function writeWorkspaceConfig(
  workspaceRoot: string,
  config: WorkspaceConfig,
): Promise<void> {
  const validated = WorkspaceConfigSchema.parse(config);
  const serialized = YAML.stringify(validated, {
    lineWidth: 0,
    defaultKeyType: 'PLAIN',
    defaultStringType: 'PLAIN',
  });
  await writeFileAtomic(configPath(workspaceRoot), serialized.endsWith('\n') ? serialized : `${serialized}\n`);
}

export async function updateWorkspaceConfig(
  workspaceRoot: string,
  mutator: (config: WorkspaceConfig) => WorkspaceConfig | Promise<WorkspaceConfig>,
): Promise<WorkspaceConfig> {
  const current = await readWorkspaceConfig(workspaceRoot);
  const next = await mutator(structuredClone(current));
  const validated = WorkspaceConfigSchema.parse(next);
  await writeWorkspaceConfig(workspaceRoot, validated);
  return validated;
}
