import fsp from 'node:fs/promises';
import path from 'node:path';
import { pathExists, isDirectory } from '../utils/fs.js';
import { SOURCES_DIR, WIKI_DIR, toPosix } from '../utils/paths.js';
import {
  expectedSourcePath,
  expectedWikiPath,
  resolveSourcePath,
  resolveWikiPath,
} from '../utils/workspace-path.js';
import type { WorkspaceConfig } from '../workspace/schema.js';

const ENTRY_PAGE_NAMES = new Set([
  'index.md',
  'index.mdx',
  'readme.md',
  'readme.mdx',
]);

const ENTRY_PAGE_PREFIXES = ['overview', 'introduction', 'architecture'];

const SOURCE_IDENTITY_FILES = new Set([
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'settings.gradle',
  'settings.gradle.kts',
  'package.json',
  'go.mod',
  'cargo.toml',
  'pyproject.toml',
  'composer.json',
  'gemfile',
  'makefile',
]);

export type EntryShape = 'single' | 'nested-projects' | 'empty' | 'missing' | 'mixed';

export interface LogicalProject {
  path: string;
  name: string;
  entryPages: string[];
  identityFiles: string[];
}

export interface ManagedSourceInventory {
  id: string;
  type: 'local' | 'git';
  path: string;
  ok: boolean;
  logicalProjects: LogicalProject[];
  notes: string[];
}

export interface ManagedWikiInventory {
  id: string;
  type: 'local' | 'git';
  path: string;
  ok: boolean;
  shape: EntryShape;
  logicalProjects: LogicalProject[];
  notes: string[];
}

export interface DiscoverReport {
  root: string;
  name: string;
  version: number;
  sources: ManagedSourceInventory[];
  wiki: ManagedWikiInventory[];
  orphans: {
    sources: string[];
    wiki: string[];
  };
  guidance: string[];
}

async function listImmediateDirectories(dir: string): Promise<string[]> {
  if (!(await isDirectory(dir))) {
    return [];
  }
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const names: string[] = [];
  for (const entry of entries) {
    if (entry.name === '.DS_Store' || entry.name.startsWith('.')) {
      continue;
    }
    // Follow symlinks: managed local resources are symlinks to directories.
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() || entry.isSymbolicLink()) {
      if (await isDirectory(full)) {
        names.push(entry.name);
      }
    }
  }
  return names.sort((a, b) => a.localeCompare(b));
}

async function listImmediateFiles(dir: string): Promise<string[]> {
  if (!(await isDirectory(dir))) {
    return [];
  }
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function isEntryPageName(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  if (ENTRY_PAGE_NAMES.has(lower)) {
    return true;
  }
  if (!lower.endsWith('.md') && !lower.endsWith('.mdx')) {
    return false;
  }
  const stem = lower.replace(/\.mdx?$/, '');
  return ENTRY_PAGE_PREFIXES.some(
    (prefix) => stem === prefix || stem.startsWith(`${prefix}-`) || stem.startsWith(`${prefix}_`),
  );
}

function isSourceIdentityFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  if (SOURCE_IDENTITY_FILES.has(lower)) {
    return true;
  }
  return (
    lower.endsWith('.sln') ||
    lower.endsWith('.csproj') ||
    lower === 'readme.md' ||
    lower === 'readme.mdx'
  );
}

async function collectEntryPages(dir: string, relativeRoot: string): Promise<string[]> {
  const files = await listImmediateFiles(dir);
  return files
    .filter((name) => isEntryPageName(name))
    .map((name) => toPosix(path.join(relativeRoot, name)));
}

async function collectIdentityFiles(dir: string, relativeRoot: string): Promise<string[]> {
  const files = await listImmediateFiles(dir);
  return files
    .filter((name) => isSourceIdentityFile(name))
    .map((name) => toPosix(path.join(relativeRoot, name)));
}

async function inspectLogicalProject(
  absoluteDir: string,
  relativePath: string,
  name: string,
): Promise<LogicalProject> {
  return {
    path: toPosix(relativePath),
    name,
    entryPages: await collectEntryPages(absoluteDir, relativePath),
    identityFiles: await collectIdentityFiles(absoluteDir, relativePath),
  };
}

async function inspectSourceEntry(
  workspaceRoot: string,
  id: string,
  type: 'local' | 'git',
): Promise<ManagedSourceInventory> {
  const relativePath = expectedSourcePath(id);
  const notes: string[] = [];
  let absolute: string;
  try {
    absolute = resolveSourcePath(workspaceRoot, id);
  } catch (error) {
    return {
      id,
      type,
      path: relativePath,
      ok: false,
      logicalProjects: [],
      notes: [(error as Error).message],
    };
  }

  if (!(await pathExists(absolute))) {
    return {
      id,
      type,
      path: relativePath,
      ok: false,
      logicalProjects: [],
      notes: ['path missing'],
    };
  }

  if (!(await isDirectory(absolute))) {
    return {
      id,
      type,
      path: relativePath,
      ok: false,
      logicalProjects: [],
      notes: ['path is not a directory'],
    };
  }

  const project = await inspectLogicalProject(absolute, relativePath, id);
  if (project.identityFiles.length === 0) {
    notes.push('no root identity/manifest files detected (still one logical sources project)');
  }

  return {
    id,
    type,
    path: relativePath,
    ok: true,
    logicalProjects: [project],
    notes,
  };
}

async function inspectWikiEntry(
  workspaceRoot: string,
  id: string,
  type: 'local' | 'git',
): Promise<ManagedWikiInventory> {
  const relativePath = expectedWikiPath(id);
  const notes: string[] = [];
  let absolute: string;
  try {
    absolute = resolveWikiPath(workspaceRoot, id);
  } catch (error) {
    return {
      id,
      type,
      path: relativePath,
      ok: false,
      shape: 'missing',
      logicalProjects: [],
      notes: [(error as Error).message],
    };
  }

  if (!(await pathExists(absolute))) {
    return {
      id,
      type,
      path: relativePath,
      ok: false,
      shape: 'missing',
      logicalProjects: [],
      notes: ['path missing'],
    };
  }

  if (!(await isDirectory(absolute))) {
    return {
      id,
      type,
      path: relativePath,
      ok: false,
      shape: 'missing',
      logicalProjects: [],
      notes: ['path is not a directory'],
    };
  }

  const rootProject = await inspectLogicalProject(absolute, relativePath, id);
  const childNames = await listImmediateDirectories(absolute);
  const childProjects: LogicalProject[] = [];
  for (const child of childNames) {
    const childAbs = path.join(absolute, child);
    const childRel = toPosix(path.join(relativePath, child));
    const childProject = await inspectLogicalProject(childAbs, childRel, child);
    if (childProject.entryPages.length > 0) {
      childProjects.push(childProject);
    }
  }

  const rootHasEntry = rootProject.entryPages.length > 0;
  let shape: EntryShape;
  let logicalProjects: LogicalProject[];

  if (rootHasEntry && childProjects.length === 0) {
    shape = 'single';
    logicalProjects = [rootProject];
  } else if (!rootHasEntry && childProjects.length > 0) {
    shape = 'nested-projects';
    logicalProjects = childProjects;
    notes.push(
      'entry root has no overview/index pages; logical wiki projects are immediate child directories',
    );
  } else if (rootHasEntry && childProjects.length > 0) {
    shape = 'mixed';
    logicalProjects = [rootProject, ...childProjects];
    notes.push(
      'both entry root and child directories look like wiki projects; prefer root unless children own distinct domains',
    );
  } else if (!rootHasEntry && childProjects.length === 0) {
    // Still expose the managed entry so agents do not drop it.
    shape = 'empty';
    logicalProjects = [rootProject];
    notes.push(
      'no entry pages at root or in immediate children; do not treat as absent — inspect deeper or exclude with reason',
    );
  } else {
    shape = 'single';
    logicalProjects = [rootProject];
  }

  return {
    id,
    type,
    path: relativePath,
    ok: true,
    shape,
    logicalProjects,
    notes,
  };
}

export async function collectDiscover(
  workspaceRoot: string,
  config: WorkspaceConfig,
): Promise<DiscoverReport> {
  const sources: ManagedSourceInventory[] = [];
  for (const [id, entry] of Object.entries(config.sources)) {
    sources.push(await inspectSourceEntry(workspaceRoot, id, entry.type));
  }
  sources.sort((a, b) => a.id.localeCompare(b.id));

  const wiki: ManagedWikiInventory[] = [];
  for (const [id, entry] of Object.entries(config.wiki)) {
    wiki.push(await inspectWikiEntry(workspaceRoot, id, entry.type));
  }
  wiki.sort((a, b) => a.id.localeCompare(b.id));

  const registeredSources = new Set(Object.keys(config.sources));
  const registeredWiki = new Set(Object.keys(config.wiki));

  const diskSources = await listImmediateDirectories(path.join(workspaceRoot, SOURCES_DIR));
  const diskWiki = await listImmediateDirectories(path.join(workspaceRoot, WIKI_DIR));

  const orphanSources = diskSources.filter((name) => !registeredSources.has(name));
  const orphanWiki = diskWiki.filter((name) => !registeredWiki.has(name));

  const guidance = [
    'Use this inventory before any workspace-wide content search.',
    'Pair roots must be concrete paths such as sources/<id> or wiki/<id>[/<project>], never bare sources/ or wiki/.',
    'Every managed source id and every logical wiki project must appear in the Candidate Project Impact Map as select or exclude.',
    'Do not enumerate projects with grep/Glob on sources/** or wiki/*.',
  ];

  if (sources.length > 1) {
    guidance.push(
      `Registry lists ${sources.length} sources; selecting only one requires explicit exclude reasons for the others.`,
    );
  }
  if (wiki.some((item) => item.shape === 'nested-projects')) {
    guidance.push(
      'One or more wiki entries use nested-projects layout; logical projects are child directories, not wiki/*.md.',
    );
  }
  if (orphanSources.length > 0 || orphanWiki.length > 0) {
    guidance.push('Disk contains unregistered orphan directories under sources/ or wiki/; evaluate before ignoring.');
  }

  return {
    root: workspaceRoot,
    name: config.name,
    version: config.version,
    sources,
    wiki,
    orphans: {
      sources: orphanSources,
      wiki: orphanWiki,
    },
    guidance,
  };
}

export function formatDiscover(report: DiscoverReport): string {
  const lines: string[] = [];
  lines.push(`Workspace: ${report.name} (v${report.version})`);
  lines.push(`Root: ${report.root}`);
  lines.push('');
  lines.push(`Sources (${report.sources.length} managed):`);
  if (report.sources.length === 0) {
    lines.push('  (none)');
  } else {
    for (const item of report.sources) {
      const status = item.ok ? 'OK' : 'MISSING';
      lines.push(`  - ${item.id} [${item.type}] ${item.path} ${status}`);
      for (const project of item.logicalProjects) {
        const identity =
          project.identityFiles.length > 0
            ? project.identityFiles.map((p) => path.posix.basename(p)).join(', ')
            : '(no identity files)';
        lines.push(`      logical: ${project.path} identity=[${identity}]`);
      }
      for (const note of item.notes) {
        lines.push(`      note: ${note}`);
      }
    }
  }

  lines.push(`Wiki (${report.wiki.length} managed):`);
  if (report.wiki.length === 0) {
    lines.push('  (none)');
  } else {
    for (const item of report.wiki) {
      const status = item.ok ? 'OK' : 'MISSING';
      lines.push(`  - ${item.id} [${item.type}] ${item.path} ${status} shape=${item.shape}`);
      for (const project of item.logicalProjects) {
        const pages =
          project.entryPages.length > 0
            ? project.entryPages.map((p) => path.posix.basename(p)).join(', ')
            : '(no entry pages)';
        lines.push(`      logical: ${project.path} entry=[${pages}]`);
      }
      for (const note of item.notes) {
        lines.push(`      note: ${note}`);
      }
    }
  }

  if (report.orphans.sources.length > 0 || report.orphans.wiki.length > 0) {
    lines.push('Orphans (on disk, not in workspace.yaml):');
    for (const name of report.orphans.sources) {
      lines.push(`  - sources/${name}`);
    }
    for (const name of report.orphans.wiki) {
      lines.push(`  - wiki/${name}`);
    }
  }

  lines.push('Guidance:');
  for (const tip of report.guidance) {
    lines.push(`  - ${tip}`);
  }

  return lines.join('\n');
}
