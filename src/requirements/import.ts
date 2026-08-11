import fsp from 'node:fs/promises';
import path from 'node:path';
import { CliError } from '../errors.js';
import {
  ensureDir,
  listDirectMarkdownFiles,
  pathExists,
  removePath,
} from '../utils/fs.js';
import { cloneRepository } from '../utils/git.js';
import { BA2MD_DIR, REQUIREMENTS_DIR } from '../utils/paths.js';
import {
  expectedRequirementPath,
  resolveRequirementPath,
  resolveWorkspacePath,
} from '../utils/workspace-path.js';
import { readWorkspaceConfig, updateWorkspaceConfig } from '../workspace/config.js';
import type { RequirementEntry, WorkspaceConfig } from '../workspace/schema.js';
import { classifyLocator } from '../resources/classify.js';

export interface ImportResult {
  files: string[];
  entries: Record<string, RequirementEntry>;
}

export async function addRequirement(
  workspaceRoot: string,
  locatorInput: string,
  options: { cwd?: string } = {},
): Promise<ImportResult> {
  const locator = await classifyLocator(locatorInput, options.cwd ?? process.cwd());
  const config = await readWorkspaceConfig(workspaceRoot);
  const requirementsDir = resolveWorkspacePath(workspaceRoot, REQUIREMENTS_DIR);
  await ensureDir(requirementsDir);

  let planned: Array<{ name: string; absoluteSource: string }>;
  let cleanup: (() => Promise<void>) | null = null;
  let sourceLabel = locator.resolved;

  try {
    if (locator.kind === 'git') {
      const tempParent = path.join(workspaceRoot, BA2MD_DIR, 'tmp');
      const tempClone = path.join(
        tempParent,
        `req-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      );
      await cloneRepository(locator.resolved, tempClone, { tempParent });
      cleanup = async () => {
        await removePath(tempClone);
      };
      sourceLabel = locator.resolved;
      planned = await planFromDirectory(tempClone);
    } else {
      const target = locator.resolved;
      if (!(await pathExists(target))) {
        throw new CliError(`Requirement path does not exist: ${target}`);
      }
      const stat = await fsp.stat(target);
      if (stat.isFile()) {
        if (!target.toLowerCase().endsWith('.md')) {
          throw new CliError(`Requirement file must be Markdown (.md): ${target}`);
        }
        planned = [{ name: path.basename(target), absoluteSource: target }];
      } else if (stat.isDirectory()) {
        planned = await planFromDirectory(target);
      } else {
        throw new CliError(`Unsupported requirement path: ${target}`);
      }
      sourceLabel = target;
    }

    if (planned.length === 0) {
      throw new CliError('No Markdown (.md) files found to import');
    }

    // Preflight collisions before any mutation.
    const seen = new Set<string>();
    for (const item of planned) {
      if (seen.has(item.name)) {
        throw new CliError(`Duplicate requirement filename in import set: ${item.name}`);
      }
      seen.add(item.name);

      if (config.requirements[item.name]) {
        throw new CliError(`Requirement already registered: ${item.name}`);
      }

      const dest = resolveRequirementPath(workspaceRoot, item.name);
      if (await pathExists(dest)) {
        throw new CliError(`Requirement file already exists: ${expectedRequirementPath(item.name)}`);
      }
    }

    const importedAt = new Date().toISOString();
    const entries: Record<string, RequirementEntry> = {};
    const copied: string[] = [];

    try {
      for (const item of planned) {
        const dest = resolveRequirementPath(workspaceRoot, item.name);
        await fsp.copyFile(item.absoluteSource, dest);
        copied.push(item.name);
        entries[item.name] = {
          path: expectedRequirementPath(item.name),
          source: sourceLabel,
          importedAt,
        };
      }

      await updateWorkspaceConfig(workspaceRoot, (cfg) => {
        for (const [name, entry] of Object.entries(entries)) {
          cfg.requirements[name] = entry;
        }
        return cfg;
      });
    } catch (error) {
      // Roll back partial file copies; config is only written after all copies succeed.
      for (const name of copied) {
        await removePath(resolveRequirementPath(workspaceRoot, name));
      }
      throw error;
    }

    return { files: copied.sort((a, b) => a.localeCompare(b)), entries };
  } finally {
    if (cleanup) {
      await cleanup();
    }
  }
}

async function planFromDirectory(dir: string): Promise<Array<{ name: string; absoluteSource: string }>> {
  const names = await listDirectMarkdownFiles(dir);
  return names.map((name) => ({
    name,
    absoluteSource: path.join(dir, name),
  }));
}

export function listRequirements(config: WorkspaceConfig): Array<{ id: string; entry: RequirementEntry }> {
  return Object.entries(config.requirements)
    .map(([id, entry]) => ({ id, entry }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function removeRequirement(workspaceRoot: string, name: string): Promise<RequirementEntry> {
  const config = await readWorkspaceConfig(workspaceRoot);
  const entry = config.requirements[name];
  if (!entry) {
    throw new CliError(`Unknown requirement: ${name}`);
  }

  // Canonical path from key; never follow a raw entry.path join that could escape.
  const absolutePath = resolveRequirementPath(workspaceRoot, name);
  // Requirements are snapshots inside the workspace; safe to delete the file.
  if (await pathExists(absolutePath)) {
    await fsp.unlink(absolutePath);
  }

  await updateWorkspaceConfig(workspaceRoot, (cfg) => {
    delete cfg.requirements[name];
    return cfg;
  });

  return entry;
}
