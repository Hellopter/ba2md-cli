import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { initWorkspace } from '../workspace/init.js';
import { findWorkspaceRoot, requireWorkspace } from '../workspace/discovery.js';
import { readWorkspaceConfig } from '../workspace/config.js';
import { pathExists } from '../utils/fs.js';
import { makeTempDir, writeFile } from './helpers.js';

describe('init and discovery', () => {
  it('creates workspace layout and skill installs', async () => {
    const cwd = await makeTempDir();
    const result = await initWorkspace('demo', cwd);
    const root = result.root;

    assert.equal(result.created, true);
    for (const rel of [
      'workspace.yaml',
      'requirements',
      'sources',
      'wiki',
      'product',
      '.ba2md',
      '.agents/skills/ba2md/SKILL.md',
      '.claude/skills/ba2md/SKILL.md',
      '.ba2md/runtime.json',
    ]) {
      assert.equal(await pathExists(path.join(root, rel)), true, `missing ${rel}`);
    }

    const config = await readWorkspaceConfig(root);
    assert.equal(config.version, 1);
    assert.equal(config.name, 'demo');
    assert.equal(config.language, 'zh');
    assert.deepEqual(config.sources, {});
    assert.deepEqual(config.wiki, {});
    assert.deepEqual(config.requirements, {});

    const skillText = await fsp.readFile(path.join(root, '.agents/skills/ba2md/SKILL.md'), 'utf8');
    assert.match(skillText, /requirements\/\*\.md/);
    assert.doesNotMatch(skillText, /requirements\/\*\*\/\*\.md/);
  });

  it('re-init is non-destructive', async () => {
    const cwd = await makeTempDir();
    const first = await initWorkspace('demo', cwd);
    const marker = path.join(first.root, 'product', 'keep-me.txt');
    await writeFile(marker, 'preserve');
    await writeFile(path.join(first.root, 'requirements', 'a.md'), '# A\n');

    const second = await initWorkspace('demo', cwd);
    assert.equal(second.created, false);
    assert.equal(await fsp.readFile(marker, 'utf8'), 'preserve');
    assert.equal(await pathExists(path.join(first.root, 'requirements', 'a.md')), true);
  });

  it('discovers workspace from nested directories', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('demo', cwd);
    const nested = path.join(root, 'product', 'deep');
    await fsp.mkdir(nested, { recursive: true });

    assert.equal(await findWorkspaceRoot(nested), root);
    const ctx = await requireWorkspace(nested);
    assert.equal(ctx.root, root);
  });
});
