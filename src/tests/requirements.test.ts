import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { initWorkspace } from '../workspace/init.js';
import { addRequirement, listRequirements, removeRequirement } from '../requirements/import.js';
import { readWorkspaceConfig } from '../workspace/config.js';
import { pathExists } from '../utils/fs.js';
import { fileUrl, makeGitRepo, makeTempDir, writeFile } from './helpers.js';

describe('requirements import', () => {
  it('imports a single markdown file flatly', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const file = path.join(cwd, 'refund-adjustment.md');
    await writeFile(file, '# Refund\n');

    const result = await addRequirement(root, file);
    assert.deepEqual(result.files, ['refund-adjustment.md']);
    assert.equal(await pathExists(path.join(root, 'requirements', 'refund-adjustment.md')), true);

    const config = await readWorkspaceConfig(root);
    assert.ok(config.requirements['refund-adjustment.md']);
    assert.equal(config.requirements['refund-adjustment.md'].path, 'requirements/refund-adjustment.md');
  });

  it('imports only direct child markdown files from a directory', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const dir = path.join(cwd, 'reqs');
    await writeFile(path.join(dir, 'one.md'), '# one\n');
    await writeFile(path.join(dir, 'two.md'), '# two\n');
    await writeFile(path.join(dir, 'note.txt'), 'ignore\n');
    await writeFile(path.join(dir, 'nested', 'hidden.md'), '# nested\n');

    const result = await addRequirement(root, dir);
    assert.deepEqual(result.files, ['one.md', 'two.md']);
    assert.equal(await pathExists(path.join(root, 'requirements', 'nested')), false);
    assert.equal(await pathExists(path.join(root, 'requirements', 'hidden.md')), false);
  });

  it('imports only repository-root markdown from git and cleans temp checkout', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const repo = await makeGitRepo(path.join(cwd, 'req-repo'), {
      'alpha.md': '# alpha\n',
      'docs/beta.md': '# beta\n',
      'readme.txt': 'nope\n',
    });

    const result = await addRequirement(root, fileUrl(repo));
    assert.deepEqual(result.files, ['alpha.md']);
    assert.equal(await pathExists(path.join(root, 'requirements', 'alpha.md')), true);
    assert.equal(await pathExists(path.join(root, 'requirements', 'beta.md')), false);
    // Must never create requirements/<repo>/
    const entries = await fsp.readdir(path.join(root, 'requirements'));
    assert.deepEqual(entries.sort(), ['alpha.md']);
  });

  it('detects collisions before mutation', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    await writeFile(path.join(root, 'requirements', 'one.md'), '# existing\n');
    const config = await readWorkspaceConfig(root);
    config.requirements['one.md'] = {
      path: 'requirements/one.md',
      source: 'seed',
    };
    const { writeWorkspaceConfig } = await import('../workspace/config.js');
    await writeWorkspaceConfig(root, config);

    const dir = path.join(cwd, 'batch');
    await writeFile(path.join(dir, 'one.md'), '# conflict\n');
    await writeFile(path.join(dir, 'two.md'), '# two\n');

    await assert.rejects(() => addRequirement(root, dir), /already/);
    assert.equal(await pathExists(path.join(root, 'requirements', 'two.md')), false);
    const after = await readWorkspaceConfig(root);
    assert.equal(after.requirements['two.md'], undefined);
    assert.equal(await fsp.readFile(path.join(root, 'requirements', 'one.md'), 'utf8'), '# existing\n');
  });

  it('rejects non-markdown files', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const file = path.join(cwd, 'notes.txt');
    await writeFile(file, 'nope\n');
    await assert.rejects(() => addRequirement(root, file), /Markdown/);
  });

  it('lists and removes requirements', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const file = path.join(cwd, 'x.md');
    await writeFile(file, '# x\n');
    await addRequirement(root, file);

    let config = await readWorkspaceConfig(root);
    assert.equal(listRequirements(config).length, 1);

    await removeRequirement(root, 'x.md');
    assert.equal(await pathExists(path.join(root, 'requirements', 'x.md')), false);
    config = await readWorkspaceConfig(root);
    assert.equal(listRequirements(config).length, 0);
  });
});
