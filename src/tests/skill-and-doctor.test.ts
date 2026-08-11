import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { initWorkspace } from '../workspace/init.js';
import {
  installSkill,
  inspectSkillInstalls,
  repairSkill,
  skillHasProblems,
} from '../skill/install.js';
import { collectStatus, formatStatus } from '../diagnostics/status.js';
import { runDoctor, formatDoctor } from '../diagnostics/doctor.js';
import { readWorkspaceConfig } from '../workspace/config.js';
import { addSource } from '../resources/source.js';
import { makeTempDir, writeFile } from './helpers.js';

describe('skill, status, doctor', () => {
  it('records digests and detects drift then repairs', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);

    let inspection = await inspectSkillInstalls(root);
    assert.equal(skillHasProblems(inspection.results), false);

    const skillFile = path.join(root, '.agents/skills/ba2md/SKILL.md');
    const original = await fsp.readFile(skillFile, 'utf8');
    await fsp.writeFile(skillFile, `${original}\n# tampered\n`);

    inspection = await inspectSkillInstalls(root);
    assert.equal(skillHasProblems(inspection.results), true);
    assert.ok(inspection.results.some((r) => r.status === 'drift'));

    const doctor = await runDoctor(root);
    assert.equal(doctor.ok, false);
    assert.ok(doctor.issues.some((i) => i.code.startsWith('skill_')));

    await repairSkill(root);
    inspection = await inspectSkillInstalls(root);
    assert.equal(skillHasProblems(inspection.results), false);
    assert.equal((await runDoctor(root)).ok, true);
  });

  it('status summarizes workspace', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const sourceDir = path.join(cwd, 'src');
    await fsp.mkdir(sourceDir);
    await writeFile(path.join(sourceDir, 'a.txt'), 'a\n');
    await addSource(root, sourceDir, { id: 'svc' });

    const config = await readWorkspaceConfig(root);
    const report = await collectStatus(root, config);
    const text = formatStatus(report);
    assert.match(text, /Workspace: ws/);
    assert.match(text, /svc/);
    assert.match(text, /Skill installs/);
  });

  it('doctor fails on broken local links', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const sourceDir = path.join(cwd, 'ephemeral');
    await fsp.mkdir(sourceDir);
    await addSource(root, sourceDir, { id: 'gone' });
    await fsp.rm(sourceDir, { recursive: true, force: true });

    const report = await runDoctor(root);
    assert.equal(report.ok, false);
    assert.ok(report.issues.some((i) => i.code === 'broken_link'));
    assert.match(formatDoctor(report), /gone/);
  });

  it('skill install is idempotent', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const first = await installSkill(root);
    const second = await installSkill(root);
    assert.equal(first.skill.packageDigest, second.skill.packageDigest);
  });
});
