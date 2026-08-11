import fsp from 'node:fs/promises';
import path from 'node:path';
import { CliError } from '../errors.js';
import { BA2MD_DIR } from '../utils/paths.js';
import { pathExists, removeManagedEntry } from '../utils/fs.js';
import { cloneRepository } from '../utils/git.js';
import {
  expectedSourcePath,
  expectedWikiPath,
  resolveSourcePath,
  resolveWikiPath,
} from '../utils/workspace-path.js';
import { readWorkspaceConfig, updateWorkspaceConfig } from '../workspace/config.js';
import type { ResourceEntry, WorkspaceConfig } from '../workspace/schema.js';
import { classifyLocator } from './classify.js';
import { inferResourceId } from './ids.js';
import { linkLocalDirectory } from './link.js';

export interface AddResourceOptions {
  id?: string;
  ref?: string;
  cwd?: string;
}

export async function addSource(
  workspaceRoot: string,
  locatorInput: string,
  options: AddResourceOptions = {},
): Promise<{ id: string; entry: ResourceEntry }> {
  return addManagedResource(workspaceRoot, 'sources', locatorInput, options);
}

export async function addWiki(
  workspaceRoot: string,
  locatorInput: string,
  options: AddResourceOptions = {},
): Promise<{ id: string; entry: ResourceEntry }> {
  return addManagedResource(workspaceRoot, 'wiki', locatorInput, options);
}

async function addManagedResource(
  workspaceRoot: string,
  collection: 'sources' | 'wiki',
  locatorInput: string,
  options: AddResourceOptions,
): Promise<{ id: string; entry: ResourceEntry }> {
  const locator = await classifyLocator(locatorInput, options.cwd ?? process.cwd());
  const id = inferResourceId(locator, options.id);
  const relativePath =
    collection === 'sources' ? expectedSourcePath(id) : expectedWikiPath(id);
  const absolutePath =
    collection === 'sources'
      ? resolveSourcePath(workspaceRoot, id)
      : resolveWikiPath(workspaceRoot, id);

  const config = await readWorkspaceConfig(workspaceRoot);
  if (config[collection][id]) {
    throw new CliError(`${collection.slice(0, -1)} id "${id}" already exists`);
  }
  if (await pathExists(absolutePath)) {
    throw new CliError(`Path already exists: ${relativePath}`);
  }

  if (locator.kind === 'local') {
    if (!(await pathExists(locator.resolved))) {
      throw new CliError(`Local directory does not exist: ${locator.resolved}`);
    }
    const stat = await fsp.stat(locator.resolved);
    if (!stat.isDirectory()) {
      throw new CliError(`Local path is not a directory: ${locator.resolved}`);
    }

    await linkLocalDirectory(locator.resolved, absolutePath);

    const entry: ResourceEntry = {
      type: 'local',
      path: relativePath,
      locator: locator.resolved,
      linkedAt: new Date().toISOString(),
    };

    try {
      await updateWorkspaceConfig(workspaceRoot, (cfg) => {
        cfg[collection][id] = entry;
        return cfg;
      });
    } catch (error) {
      // Symmetrical with git: do not leave a dangling workspace link if config write fails.
      await removeManagedEntry(absolutePath);
      throw error;
    }

    return { id, entry };
  }

  // Git clone
  const tempParent = path.join(workspaceRoot, BA2MD_DIR, 'tmp');
  try {
    await cloneRepository(locator.resolved, absolutePath, {
      ref: options.ref,
      tempParent,
    });
  } catch (error) {
    await removeManagedEntry(absolutePath);
    throw error;
  }

  const entry: ResourceEntry = {
    type: 'git',
    path: relativePath,
    locator: locator.resolved,
    ref: options.ref,
    linkedAt: new Date().toISOString(),
  };

  try {
    await updateWorkspaceConfig(workspaceRoot, (cfg) => {
      cfg[collection][id] = entry;
      return cfg;
    });
  } catch (error) {
    await removeManagedEntry(absolutePath);
    throw error;
  }

  return { id, entry };
}

export async function listResources(
  config: WorkspaceConfig,
  collection: 'sources' | 'wiki',
): Promise<Array<{ id: string; entry: ResourceEntry }>> {
  return Object.entries(config[collection])
    .map(([id, entry]) => ({ id, entry }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function removeResource(
  workspaceRoot: string,
  collection: 'sources' | 'wiki',
  id: string,
): Promise<ResourceEntry> {
  const config = await readWorkspaceConfig(workspaceRoot);
  const entry = config[collection][id];
  if (!entry) {
    throw new CliError(`Unknown ${collection.slice(0, -1)} id: ${id}`);
  }

  // Canonical path from id (schema already requires entry.path match); never trust raw joins alone.
  const absolutePath =
    collection === 'sources'
      ? resolveSourcePath(workspaceRoot, id)
      : resolveWikiPath(workspaceRoot, id);
  // Never follow local symlinks into external directories.
  await removeManagedEntry(absolutePath);

  await updateWorkspaceConfig(workspaceRoot, (cfg) => {
    delete cfg[collection][id];
    return cfg;
  });

  return entry;
}
