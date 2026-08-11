import fsp from 'node:fs/promises';
import path from 'node:path';
import { CliError } from '../errors.js';
import { copyDirectory, ensureDir, pathExists, removePath, writeFileAtomic } from '../utils/fs.js';
import {
  AGENTS_SKILL_DIR,
  CLAUDE_SKILL_DIR,
  packagedSkillRoot,
  runtimePath,
  toPosix,
} from '../utils/paths.js';
import { computeDirectoryDigest } from './digest.js';

export interface SkillInstallRecord {
  path: string;
  digest: string;
  packageDigest: string;
  installedAt: string;
}

export interface RuntimeManifest {
  version: 1;
  skill: {
    packageDigest: string;
    installs: Record<string, SkillInstallRecord>;
  };
}

export const SKILL_INSTALL_TARGETS = [AGENTS_SKILL_DIR, CLAUDE_SKILL_DIR] as const;

export type SkillInstallMode = 'install' | 'repair';

interface TargetDecision {
  relativeTarget: string;
  posixTarget: string;
  dest: string;
  /** When true, replace/create the target directory from the package. */
  write: boolean;
  reason: string;
}

/**
 * Install or refresh managed Skill copies.
 *
 * Ownership rules:
 * - missing target → install/recreate
 * - exists without runtime ownership record → unmanaged, refuse (all modes)
 * - exists and digest matches recorded ownership → safe managed refresh
 * - exists and digest differs from record (drift):
 *   - install/init: refuse and preserve
 *   - repair: overwrite only when previously managed
 * Both targets are preflighted before any mutation.
 */
export async function installSkill(
  workspaceRoot: string,
  options: { mode?: SkillInstallMode } = {},
): Promise<RuntimeManifest> {
  const mode: SkillInstallMode = options.mode ?? 'install';
  const source = packagedSkillRoot();
  if (!(await pathExists(source))) {
    throw new CliError(`Packaged skill not found at ${source}`);
  }

  const packageDigest = await computeDirectoryDigest(source);
  const manifest = await readRuntimeManifest(workspaceRoot);
  const decisions = await preflightSkillTargets(workspaceRoot, manifest, mode);

  const refusals = decisions.filter((d) => d.write === false && d.reason.startsWith('refuse:'));
  if (refusals.length > 0) {
    const detail = refusals.map((d) => `${d.posixTarget}: ${d.reason.slice('refuse:'.length).trim()}`).join('\n- ');
    throw new CliError(
      `Skill ${mode} refused (no targets modified):\n- ${detail}`,
    );
  }

  const installedAt = new Date().toISOString();
  const installs: Record<string, SkillInstallRecord> = {};

  for (const decision of decisions) {
    if (decision.write) {
      await ensureDir(path.dirname(decision.dest));
      await removePath(decision.dest);
      await copyDirectory(source, decision.dest);
    }

    if (!(await pathExists(decision.dest))) {
      throw new CliError(`Skill target missing after install planning: ${decision.posixTarget}`);
    }

    const digest = await computeDirectoryDigest(decision.dest);
    installs[decision.posixTarget] = {
      path: decision.posixTarget,
      digest,
      packageDigest,
      installedAt: decision.write
        ? installedAt
        : manifest?.skill.installs[decision.posixTarget]?.installedAt ?? installedAt,
    };
  }

  const nextManifest: RuntimeManifest = {
    version: 1,
    skill: {
      packageDigest,
      installs,
    },
  };

  await writeRuntimeManifest(workspaceRoot, nextManifest);
  return nextManifest;
}

async function preflightSkillTargets(
  workspaceRoot: string,
  manifest: RuntimeManifest | null,
  mode: SkillInstallMode,
): Promise<TargetDecision[]> {
  const decisions: TargetDecision[] = [];

  for (const relativeTarget of SKILL_INSTALL_TARGETS) {
    const posixTarget = toPosix(relativeTarget);
    const dest = path.join(workspaceRoot, relativeTarget);
    const exists = await pathExists(dest);
    const recorded = manifest?.skill.installs[posixTarget];

    if (!exists) {
      decisions.push({
        relativeTarget,
        posixTarget,
        dest,
        write: true,
        reason: recorded ? 'missing previously managed target' : 'absent target',
      });
      continue;
    }

    if (!recorded) {
      decisions.push({
        relativeTarget,
        posixTarget,
        dest,
        write: false,
        reason: 'refuse: unmanaged (exists without runtime ownership record)',
      });
      continue;
    }

    const actual = await computeDirectoryDigest(dest);
    if (actual === recorded.digest) {
      decisions.push({
        relativeTarget,
        posixTarget,
        dest,
        write: true,
        reason: 'managed digest matches record; safe refresh',
      });
      continue;
    }

    // Drift from recorded managed digest.
    if (mode === 'repair') {
      decisions.push({
        relativeTarget,
        posixTarget,
        dest,
        write: true,
        reason: 'managed drift; repair allowed',
      });
      continue;
    }

    decisions.push({
      relativeTarget,
      posixTarget,
      dest,
      write: false,
      reason: 'refuse: managed drift detected; run `ba2md skill repair` to overwrite',
    });
  }

  return decisions;
}

export async function readRuntimeManifest(workspaceRoot: string): Promise<RuntimeManifest | null> {
  const file = runtimePath(workspaceRoot);
  if (!(await pathExists(file))) {
    return null;
  }
  try {
    const raw = await fsp.readFile(file, 'utf8');
    return JSON.parse(raw) as RuntimeManifest;
  } catch (error) {
    throw new CliError(`Invalid .ba2md/runtime.json: ${(error as Error).message}`);
  }
}

export async function writeRuntimeManifest(
  workspaceRoot: string,
  manifest: RuntimeManifest,
): Promise<void> {
  await writeFileAtomic(runtimePath(workspaceRoot), `${JSON.stringify(manifest, null, 2)}\n`);
}

export type SkillHealth =
  | { status: 'ok'; target: string; digest: string }
  | { status: 'missing'; target: string }
  | { status: 'drift'; target: string; expected: string; actual: string }
  | { status: 'unmanaged'; target: string };

export async function inspectSkillInstalls(workspaceRoot: string): Promise<{
  packageDigest: string;
  manifest: RuntimeManifest | null;
  results: SkillHealth[];
}> {
  const source = packagedSkillRoot();
  if (!(await pathExists(source))) {
    throw new CliError(`Packaged skill not found at ${source}`);
  }
  const packageDigest = await computeDirectoryDigest(source);
  const manifest = await readRuntimeManifest(workspaceRoot);
  const results: SkillHealth[] = [];

  for (const relativeTarget of SKILL_INSTALL_TARGETS) {
    const posixTarget = toPosix(relativeTarget);
    const dest = path.join(workspaceRoot, relativeTarget);
    if (!(await pathExists(dest))) {
      results.push({ status: 'missing', target: posixTarget });
      continue;
    }

    const actual = await computeDirectoryDigest(dest);
    const recorded = manifest?.skill.installs[posixTarget];

    if (!recorded) {
      results.push({ status: 'unmanaged', target: posixTarget });
      continue;
    }

    if (actual !== recorded.digest || recorded.packageDigest !== packageDigest || actual !== packageDigest) {
      results.push({
        status: 'drift',
        target: posixTarget,
        expected: packageDigest,
        actual,
      });
      continue;
    }

    results.push({ status: 'ok', target: posixTarget, digest: actual });
  }

  return { packageDigest, manifest, results };
}

export async function repairSkill(workspaceRoot: string): Promise<RuntimeManifest> {
  return installSkill(workspaceRoot, { mode: 'repair' });
}

export function skillHasProblems(results: SkillHealth[]): boolean {
  return results.some((result) => result.status !== 'ok');
}
