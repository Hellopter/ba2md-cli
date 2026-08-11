import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { initWorkspace } from '../workspace/init.js';
import { readWorkspaceConfig } from '../workspace/config.js';
import { WorkspaceConfigSchema } from '../workspace/schema.js';
import { addSource, removeResource } from '../resources/source.js';
import { removeRequirement } from '../requirements/import.js';
import {
  installSkill,
  inspectSkillInstalls,
  readRuntimeManifest,
  repairSkill,
  skillHasProblems,
  SKILL_INSTALL_TARGETS,
} from '../skill/install.js';
import { pathExists } from '../utils/fs.js';
import { toPosix } from '../utils/paths.js';
import {
  normalizeWorkspaceRelativePath,
  resolveWorkspacePath,
} from '../utils/workspace-path.js';
import { makeTempDir, writeFile } from './helpers.js';

describe('path containment', () => {
  it('rejects escaping relative paths in safe resolver', () => {
    const root = path.resolve('/tmp/ba2md-workspace-root-example');
    assert.throws(() => normalizeWorkspaceRelativePath('../victim'), /escape|\.\./i);
    assert.throws(() => resolveWorkspacePath(root, '../victim'), /escape|\.\./i);
    assert.throws(() => resolveWorkspacePath(root, 'sources/../../victim'), /escape|\.\.|empty/i);
    assert.throws(() => normalizeWorkspaceRelativePath('/etc/passwd'), /absolute/i);
  });

  it('rejects malicious workspace.yaml paths and cannot delete an external victim', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const victim = path.join(cwd, 'victim');
    await fsp.mkdir(victim);
    await writeFile(path.join(victim, 'secret.txt'), 'do-not-delete\n');

    const malicious = {
      version: 1 as const,
      name: 'ws',
      language: 'zh',
      sources: {
        evil: {
          type: 'local' as const,
          path: '../victim',
          locator: victim,
        },
      },
      wiki: {},
      requirements: {},
    };

    const parsed = WorkspaceConfigSchema.safeParse(malicious);
    assert.equal(parsed.success, false);

    // Even if written raw to disk, readWorkspaceConfig must reject it.
    const rawYaml = [
      'version: 1',
      'name: ws',
      'language: zh',
      'sources:',
      '  evil:',
      '    type: local',
      '    path: ../victim',
      `    locator: ${victim}`,
      'wiki: {}',
      'requirements: {}',
      '',
    ].join('\n');
    await fsp.writeFile(path.join(root, 'workspace.yaml'), rawYaml, 'utf8');

    await assert.rejects(() => readWorkspaceConfig(root), /schema|path/i);
    await assert.rejects(() => removeResource(root, 'sources', 'evil'), /schema|path|Unknown/i);

    assert.equal(await pathExists(path.join(victim, 'secret.txt')), true);
    assert.equal(await fsp.readFile(path.join(victim, 'secret.txt'), 'utf8'), 'do-not-delete\n');
  });

  it('rejects escaping requirement paths and cannot delete external files', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const victimFile = path.join(cwd, 'outside.md');
    await writeFile(victimFile, '# outside\n');

    const rawYaml = [
      'version: 1',
      'name: ws',
      'language: zh',
      'sources: {}',
      'wiki: {}',
      'requirements:',
      '  outside.md:',
      '    path: ../outside.md',
      `    source: ${victimFile}`,
      '',
    ].join('\n');
    await fsp.writeFile(path.join(root, 'workspace.yaml'), rawYaml, 'utf8');

    await assert.rejects(() => readWorkspaceConfig(root), /schema|path/i);
    await assert.rejects(() => removeRequirement(root, 'outside.md'), /schema|path|Unknown/i);
    assert.equal(await pathExists(victimFile), true);
  });
});

describe('skill ownership', () => {
  it('re-init does not overwrite a drifted managed Skill', async () => {
    const cwd = await makeTempDir();
    const first = await initWorkspace('ws', cwd);
    const skillFile = path.join(first.root, '.agents/skills/ba2md/SKILL.md');
    const original = await fsp.readFile(skillFile, 'utf8');
    const edited = `${original}\n# user edit keep me\n`;
    await fsp.writeFile(skillFile, edited);

    await assert.rejects(() => initWorkspace('ws', cwd), /refused|drift/i);
    assert.equal(await fsp.readFile(skillFile, 'utf8'), edited);

    await assert.rejects(() => installSkill(first.root, { mode: 'install' }), /refused|drift/i);
    assert.equal(await fsp.readFile(skillFile, 'utf8'), edited);
  });

  it('refuses unmanaged pre-existing Skill directories for init/install/repair', async () => {
    const cwd = await makeTempDir();
    const root = path.join(cwd, 'adopt');
    await fsp.mkdir(root, { recursive: true });

    // Pre-existing foreign skill content before any ba2md management.
    for (const target of SKILL_INSTALL_TARGETS) {
      const dest = path.join(root, target);
      await fsp.mkdir(dest, { recursive: true });
      await writeFile(path.join(dest, 'SKILL.md'), '# foreign skill\n');
    }

    await assert.rejects(() => initWorkspace('adopt', cwd), /refused|unmanaged/i);

    // init may have created workspace.yaml before skill install failed — ensure foreign content intact.
    for (const target of SKILL_INSTALL_TARGETS) {
      const text = await fsp.readFile(path.join(root, target, 'SKILL.md'), 'utf8');
      assert.equal(text, '# foreign skill\n');
    }

    // Create a clean managed workspace, then replace one target with unmanaged content.
    const clean = await initWorkspace('clean', cwd);
    await fsp.rm(path.join(clean.root, '.agents/skills/ba2md'), { recursive: true, force: true });
    await fsp.mkdir(path.join(clean.root, '.agents/skills/ba2md'), { recursive: true });
    await writeFile(path.join(clean.root, '.agents/skills/ba2md/SKILL.md'), '# hijack\n');

    // Drop ownership record for agents target to simulate unmanaged.
    const manifest = await readRuntimeManifest(clean.root);
    assert.ok(manifest);
    delete manifest.skill.installs[toPosix(path.join('.agents', 'skills', 'ba2md'))];
    await fsp.writeFile(
      path.join(clean.root, '.ba2md/runtime.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );

    await assert.rejects(() => installSkill(clean.root, { mode: 'install' }), /unmanaged/i);
    await assert.rejects(() => repairSkill(clean.root), /unmanaged/i);
    assert.equal(
      await fsp.readFile(path.join(clean.root, '.agents/skills/ba2md/SKILL.md'), 'utf8'),
      '# hijack\n',
    );
  });

  it('repair restores a drifted previously managed Skill', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const skillFile = path.join(root, '.claude/skills/ba2md/SKILL.md');
    const original = await fsp.readFile(skillFile, 'utf8');
    await fsp.writeFile(skillFile, `${original}\n# drift\n`);

    assert.equal(skillHasProblems((await inspectSkillInstalls(root)).results), true);
    await repairSkill(root);
    const after = await inspectSkillInstalls(root);
    assert.equal(skillHasProblems(after.results), false);
    assert.doesNotMatch(await fsp.readFile(skillFile, 'utf8'), /# drift/);
  });

  it('preflight both targets prevents partial installation', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);

    // Make agents unmanaged while claude remains managed and healthy.
    const agentsDir = path.join(root, '.agents/skills/ba2md');
    const agentsBefore = await fsp.readFile(path.join(agentsDir, 'SKILL.md'), 'utf8');
    const claudeFile = path.join(root, '.claude/skills/ba2md/SKILL.md');
    const claudeBefore = await fsp.readFile(claudeFile, 'utf8');

    await fsp.rm(agentsDir, { recursive: true, force: true });
    await fsp.mkdir(agentsDir, { recursive: true });
    await writeFile(path.join(agentsDir, 'SKILL.md'), '# unmanaged-only\n');

    const manifest = await readRuntimeManifest(root);
    assert.ok(manifest);
    delete manifest.skill.installs[toPosix(path.join('.agents', 'skills', 'ba2md'))];
    await fsp.writeFile(
      path.join(root, '.ba2md/runtime.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );

    // Tamper claude so a naive partial installer would refresh it while refusing agents.
    await fsp.writeFile(claudeFile, `${claudeBefore}\n# would-be-partial\n`);

    await assert.rejects(() => installSkill(root, { mode: 'install' }), /refused|unmanaged/i);
    await assert.rejects(() => repairSkill(root), /refused|unmanaged/i);

    assert.equal(await fsp.readFile(path.join(agentsDir, 'SKILL.md'), 'utf8'), '# unmanaged-only\n');
    assert.match(await fsp.readFile(claudeFile, 'utf8'), /would-be-partial/);
    // Prove agents foreign content was not replaced with package content.
    assert.notEqual(await fsp.readFile(path.join(agentsDir, 'SKILL.md'), 'utf8'), agentsBefore);
  });

  it('managed matching installs can refresh safely', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const first = await installSkill(root, { mode: 'install' });
    const second = await installSkill(root, { mode: 'install' });
    assert.equal(first.skill.packageDigest, second.skill.packageDigest);
    assert.equal(skillHasProblems((await inspectSkillInstalls(root)).results), false);
  });
});

describe('local link config rollback', () => {
  it('removes a newly created local link if config update fails', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const sourceDir = path.join(cwd, 'ext');
    await fsp.mkdir(sourceDir);

    // Block writes in the workspace root so atomic workspace.yaml update fails,
    // while sources/ remains writable for the initial symlink.
    await fsp.chmod(root, 0o555);
    try {
      await assert.rejects(() => addSource(root, sourceDir, { id: 'rollback' }), /EACCES|EPERM|permission|read-only|EROFS/i);
      assert.equal(await pathExists(path.join(root, 'sources', 'rollback')), false);
    } finally {
      await fsp.chmod(root, 0o755);
    }

    const config = await readWorkspaceConfig(root);
    assert.equal(config.sources.rollback, undefined);
  });
});
