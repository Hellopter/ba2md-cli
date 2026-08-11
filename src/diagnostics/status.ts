import { pathExists } from '../utils/fs.js';
import {
  expectedRequirementPath,
  expectedSourcePath,
  expectedWikiPath,
  resolveRequirementPath,
  resolveSourcePath,
  resolveWikiPath,
} from '../utils/workspace-path.js';
import { inspectSkillInstalls } from '../skill/install.js';
import type { WorkspaceConfig } from '../workspace/schema.js';

export interface StatusReport {
  root: string;
  name: string;
  version: number;
  language: string;
  sources: Array<{ id: string; type: string; path: string; ok: boolean }>;
  wiki: Array<{ id: string; type: string; path: string; ok: boolean }>;
  requirements: Array<{ id: string; path: string; ok: boolean }>;
  skill: Awaited<ReturnType<typeof inspectSkillInstalls>>;
}

export async function collectStatus(
  workspaceRoot: string,
  config: WorkspaceConfig,
): Promise<StatusReport> {
  const sources = [];
  for (const [id, entry] of Object.entries(config.sources)) {
    let ok = false;
    try {
      ok = await pathExists(resolveSourcePath(workspaceRoot, id));
    } catch {
      ok = false;
    }
    sources.push({
      id,
      type: entry.type,
      path: expectedSourcePath(id),
      ok,
    });
  }

  const wiki = [];
  for (const [id, entry] of Object.entries(config.wiki)) {
    let ok = false;
    try {
      ok = await pathExists(resolveWikiPath(workspaceRoot, id));
    } catch {
      ok = false;
    }
    wiki.push({
      id,
      type: entry.type,
      path: expectedWikiPath(id),
      ok,
    });
  }

  const requirements = [];
  for (const [id] of Object.entries(config.requirements)) {
    let ok = false;
    try {
      ok = await pathExists(resolveRequirementPath(workspaceRoot, id));
    } catch {
      ok = false;
    }
    requirements.push({
      id,
      path: expectedRequirementPath(id),
      ok,
    });
  }

  const skill = await inspectSkillInstalls(workspaceRoot);

  return {
    root: workspaceRoot,
    name: config.name,
    version: config.version,
    language: config.language,
    sources: sources.sort((a, b) => a.id.localeCompare(b.id)),
    wiki: wiki.sort((a, b) => a.id.localeCompare(b.id)),
    requirements: requirements.sort((a, b) => a.id.localeCompare(b.id)),
    skill,
  };
}

export function formatStatus(report: StatusReport): string {
  const lines: string[] = [];
  lines.push(`Workspace: ${report.name} (v${report.version})`);
  lines.push(`Root: ${report.root}`);
  lines.push(`Language: ${report.language}`);
  lines.push('');
  lines.push(`Sources (${report.sources.length}):`);
  if (report.sources.length === 0) {
    lines.push('  (none)');
  } else {
    for (const item of report.sources) {
      lines.push(`  - ${item.id} [${item.type}] ${item.path} ${item.ok ? 'OK' : 'MISSING'}`);
    }
  }

  lines.push(`Wiki (${report.wiki.length}):`);
  if (report.wiki.length === 0) {
    lines.push('  (none)');
  } else {
    for (const item of report.wiki) {
      lines.push(`  - ${item.id} [${item.type}] ${item.path} ${item.ok ? 'OK' : 'MISSING'}`);
    }
  }

  lines.push(`Requirements (${report.requirements.length}):`);
  if (report.requirements.length === 0) {
    lines.push('  (none)');
  } else {
    for (const item of report.requirements) {
      lines.push(`  - ${item.id} ${item.path} ${item.ok ? 'OK' : 'MISSING'}`);
    }
  }

  lines.push('Skill installs:');
  for (const result of report.skill.results) {
    if (result.status === 'ok') {
      lines.push(`  - ${result.target}: OK (${result.digest.slice(0, 12)}…)`);
    } else if (result.status === 'missing') {
      lines.push(`  - ${result.target}: MISSING`);
    } else if (result.status === 'drift') {
      lines.push(`  - ${result.target}: DRIFT`);
    } else {
      lines.push(`  - ${result.target}: UNMANAGED`);
    }
  }

  return lines.join('\n');
}
