import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { initWorkspace } from '../workspace/init.js';
import { addSource, addWiki, listResources, removeResource } from '../resources/source.js';
import { readWorkspaceConfig } from '../workspace/config.js';
import { pathExists, isSymlink } from '../utils/fs.js';
import { fileUrl, makeGitRepo, makeTempDir, writeFile } from './helpers.js';

describe('source and wiki resources', () => {
  it('links local source and wiki directories', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);

    const sourceDir = path.join(cwd, 'ext-source');
    const wikiDir = path.join(cwd, 'ext-wiki');
    await fsp.mkdir(sourceDir, { recursive: true });
    await fsp.mkdir(wikiDir, { recursive: true });
    await writeFile(path.join(sourceDir, 'main.go'), 'package main\n');
    await writeFile(path.join(wikiDir, 'README.md'), '# wiki\n');

    const source = await addSource(root, sourceDir, { id: 'app' });
    const wiki = await addWiki(root, wikiDir);

    assert.equal(source.entry.type, 'local');
    assert.equal(wiki.entry.type, 'local');
    assert.equal(await isSymlink(path.join(root, 'sources', 'app')), true);
    assert.equal(await pathExists(path.join(root, 'sources', 'app', 'main.go')), true);

    const config = await readWorkspaceConfig(root);
    const listed = await listResources(config, 'sources');
    assert.equal(listed.length, 1);
    assert.equal(listed[0].id, 'app');
  });

  it('clones git sources via file:// fixtures', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const repo = await makeGitRepo(path.join(cwd, 'repo'), {
      'README.md': '# repo\n',
      'src/a.ts': 'export {}\n',
    });

    const added = await addSource(root, fileUrl(repo), { id: 'cloned' });
    assert.equal(added.entry.type, 'git');
    assert.equal(await pathExists(path.join(root, 'sources', 'cloned', 'README.md')), true);
    assert.equal(await isSymlink(path.join(root, 'sources', 'cloned')), false);
  });

  it('remove does not delete external local directories', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const sourceDir = path.join(cwd, 'keep-source');
    await fsp.mkdir(sourceDir, { recursive: true });
    await writeFile(path.join(sourceDir, 'file.txt'), 'safe\n');

    await addSource(root, sourceDir, { id: 'keep' });
    await removeResource(root, 'sources', 'keep');

    assert.equal(await pathExists(path.join(root, 'sources', 'keep')), false);
    assert.equal(await pathExists(path.join(sourceDir, 'file.txt')), true);

    const config = await readWorkspaceConfig(root);
    assert.equal(config.sources.keep, undefined);
  });

  it('remove deletes managed git clones only', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const repo = await makeGitRepo(path.join(cwd, 'repo2'), { 'a.md': '# a\n' });
    await addWiki(root, fileUrl(repo), { id: 'w' });
    assert.equal(await pathExists(path.join(root, 'wiki', 'w', 'a.md')), true);
    await removeResource(root, 'wiki', 'w');
    assert.equal(await pathExists(path.join(root, 'wiki', 'w')), false);
    assert.equal(await pathExists(path.join(repo, 'a.md')), true);
  });
});
