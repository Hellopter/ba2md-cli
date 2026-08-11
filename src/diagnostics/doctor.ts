import fsp from 'node:fs/promises';
import { pathExists, isSymlink } from '../utils/fs.js';
import {
  resolveRequirementPath,
  resolveSourcePath,
  resolveWikiPath,
} from '../utils/workspace-path.js';
import { inspectSkillInstalls, skillHasProblems } from '../skill/install.js';
import { readWorkspaceConfig } from '../workspace/config.js';
import type { WorkspaceConfig } from '../workspace/schema.js';

export interface DoctorIssue {
  code: string;
  message: string;
}

export interface DoctorReport {
  ok: boolean;
  issues: DoctorIssue[];
}

export async function runDoctor(
  workspaceRoot: string,
  config?: WorkspaceConfig,
): Promise<DoctorReport> {
  const issues: DoctorIssue[] = [];
  let resolvedConfig: WorkspaceConfig;

  try {
    resolvedConfig = config ?? (await readWorkspaceConfig(workspaceRoot));
  } catch (error) {
    return {
      ok: false,
      issues: [
        {
          code: 'invalid_config',
          message: (error as Error).message,
        },
      ],
    };
  }

  for (const [id, entry] of Object.entries(resolvedConfig.sources)) {
    await checkResource(workspaceRoot, 'source', id, entry.type, issues, resolveSourcePath);
  }
  for (const [id, entry] of Object.entries(resolvedConfig.wiki)) {
    await checkResource(workspaceRoot, 'wiki', id, entry.type, issues, resolveWikiPath);
  }
  for (const [id] of Object.entries(resolvedConfig.requirements)) {
    try {
      const absolute = resolveRequirementPath(workspaceRoot, id);
      if (!(await pathExists(absolute))) {
        issues.push({
          code: 'missing_requirement',
          message: `Requirement file missing for "${id}"`,
        });
      }
    } catch (error) {
      issues.push({
        code: 'unsafe_path',
        message: `Requirement "${id}" path rejected: ${(error as Error).message}`,
      });
    }
  }

  try {
    const skill = await inspectSkillInstalls(workspaceRoot);
    if (skillHasProblems(skill.results)) {
      for (const result of skill.results) {
        if (result.status === 'ok') continue;
        issues.push({
          code: `skill_${result.status}`,
          message:
            result.status === 'drift'
              ? `Skill install drifted: ${result.target}`
              : `Skill install ${result.status}: ${result.target}`,
        });
      }
    }
  } catch (error) {
    issues.push({
      code: 'skill_error',
      message: (error as Error).message,
    });
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

async function checkResource(
  workspaceRoot: string,
  kind: string,
  id: string,
  type: string,
  issues: DoctorIssue[],
  resolve: (workspaceRoot: string, id: string) => string,
): Promise<void> {
  let absolute: string;
  try {
    absolute = resolve(workspaceRoot, id);
  } catch (error) {
    issues.push({
      code: 'unsafe_path',
      message: `${kind} "${id}" path rejected: ${(error as Error).message}`,
    });
    return;
  }

  if (!(await pathExists(absolute))) {
    issues.push({
      code: type === 'local' ? 'broken_link' : 'missing_clone',
      message: `${kind} "${id}" path missing`,
    });
    return;
  }

  if (type === 'local') {
    const linked = await isSymlink(absolute);
    if (!linked && process.platform === 'win32') {
      try {
        const stat = await fsp.stat(absolute);
        if (!stat.isDirectory()) {
          issues.push({
            code: 'broken_link',
            message: `${kind} "${id}" local link is not a directory`,
          });
        }
      } catch {
        issues.push({
          code: 'broken_link',
          message: `${kind} "${id}" local link is broken`,
        });
      }
      return;
    }

    if (!linked) {
      try {
        await fsp.stat(absolute);
      } catch {
        issues.push({
          code: 'broken_link',
          message: `${kind} "${id}" local link is broken`,
        });
      }
    } else {
      try {
        await fsp.stat(absolute);
      } catch {
        issues.push({
          code: 'broken_link',
          message: `${kind} "${id}" local link target is missing`,
        });
      }
    }
  }
}

export function formatDoctor(report: DoctorReport): string {
  if (report.ok) {
    return 'Doctor: all checks passed';
  }
  const lines = [`Doctor: ${report.issues.length} issue(s)`];
  for (const issue of report.issues) {
    lines.push(`  - [${issue.code}] ${issue.message}`);
  }
  return lines.join('\n');
}
