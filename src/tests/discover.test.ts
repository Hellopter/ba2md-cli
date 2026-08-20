import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { initWorkspace } from '../workspace/init.js';
import { addSource, addWiki } from '../resources/source.js';
import { readWorkspaceConfig } from '../workspace/config.js';
import { collectDiscover, formatDiscover } from '../diagnostics/discover.js';
import { collectStatus, formatStatusJson } from '../diagnostics/status.js';
import { makeTempDir, writeFile } from './helpers.js';

describe('discover inventory', () => {
  it('lists multiple sources as separate logical projects', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);

    const a = path.join(cwd, 'svc-a');
    const b = path.join(cwd, 'svc-b');
    await fsp.mkdir(a);
    await fsp.mkdir(b);
    await writeFile(path.join(a, 'pom.xml'), '<project/>\n');
    await writeFile(path.join(b, 'package.json'), '{}\n');
    await addSource(root, a, { id: 'svc-a' });
    await addSource(root, b, { id: 'svc-b' });

    const config = await readWorkspaceConfig(root);
    const report = await collectDiscover(root, config);

    assert.equal(report.sources.length, 2);
    assert.deepEqual(
      report.sources.map((s) => s.id),
      ['svc-a', 'svc-b'],
    );
    assert.equal(report.sources[0].logicalProjects.length, 1);
    assert.equal(report.sources[0].logicalProjects[0].path, 'sources/svc-a');
    assert.ok(report.sources[0].logicalProjects[0].identityFiles.some((p) => p.endsWith('pom.xml')));
    assert.match(formatDiscover(report), /svc-a/);
    assert.match(formatDiscover(report), /svc-b/);
  });

  it('expands nested wiki docs monorepo into child logical projects', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);

    const docs = path.join(cwd, 'docs');
    await writeFile(path.join(docs, 'billing', 'overview.md'), '# billing\n');
    await writeFile(path.join(docs, 'billing', 'api.md'), '# api\n');
    await writeFile(path.join(docs, 'orders', 'index.md'), '# orders\n');
    await writeFile(path.join(docs, 'orders', 'deep', 'note.md'), '# note\n');
    // Sibling without entry pages should not become a logical project.
    await writeFile(path.join(docs, 'assets', 'logo.txt'), 'x\n');
    await addWiki(root, docs, { id: 'docs' });

    const config = await readWorkspaceConfig(root);
    const report = await collectDiscover(root, config);
    assert.equal(report.wiki.length, 1);
    const wiki = report.wiki[0];
    assert.equal(wiki.shape, 'nested-projects');
    assert.deepEqual(
      wiki.logicalProjects.map((p) => p.path).sort(),
      ['wiki/docs/billing', 'wiki/docs/orders'],
    );
    assert.ok(wiki.logicalProjects.every((p) => p.entryPages.length > 0));
    assert.match(formatDiscover(report), /nested-projects/);
    assert.match(formatDiscover(report), /wiki\/docs\/billing/);
    assert.ok(wiki.outline.pages.some((p) => p.path.endsWith('billing/api.md')));
    assert.ok(wiki.outline.pages.some((p) => p.path.endsWith('orders/deep/note.md')));
    assert.equal(wiki.outline.truncated, false);
    assert.equal(wiki.outline.tree.type, 'dir');
    assert.match(formatDiscover(report), /tree:/);
    assert.match(formatDiscover(report), /marker=/);
    assert.doesNotMatch(formatDiscover(report), /entry=/);
    const text = formatDiscover(report);
    assert.match(text, /billing\//);
    assert.match(text, /api\.md/);
    assert.match(text, /deep\//);
    assert.match(text, /note\.md/);
  });

  it('lists wiki outline pages even when source.md is absent', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const wikiDir = path.join(cwd, 'plain-wiki');
    await writeFile(path.join(wikiDir, 'overview.md'), '# overview\n');
    await writeFile(path.join(wikiDir, 'architecture.md'), '# arch\n');
    await writeFile(path.join(wikiDir, 'domains', 'billing.md'), '# billing\n');
    await addWiki(root, wikiDir, { id: 'plain' });

    const config = await readWorkspaceConfig(root);
    const report = await collectDiscover(root, config);
    const wiki = report.wiki[0];
    assert.ok(wiki.outline.pages.some((p) => p.path.endsWith('overview.md')));
    assert.ok(wiki.outline.pages.some((p) => p.path.endsWith('domains/billing.md')));
    assert.equal(
      wiki.outline.pages.some((p) => p.path.endsWith('source.md')),
      false,
    );
    assert.equal(wiki.outline.tree.type, 'dir');
    assert.ok(wiki.outline.tree.children?.some((n) => n.name === 'overview.md'));
    assert.ok(
      wiki.outline.tree.children?.some(
        (n) => n.type === 'dir' && n.name === 'domains' && n.children?.some((c) => c.name === 'billing.md'),
      ),
    );
    assert.match(formatDiscover(report), /outline:/);
    assert.match(formatDiscover(report), /tree:/);
    assert.match(formatDiscover(report), /Walk each wiki outline\.tree/);
    assert.doesNotMatch(formatDiscover(report), /Do not require source\.md/);
    assert.doesNotMatch(formatDiscover(report), /overview\/architecture first/);
  });

  it('builds a tree when the root page is a Chinese filename', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const wikiDir = path.join(cwd, 'cn-wiki');
    await writeFile(path.join(wikiDir, '架构.md'), '# arch\n');
    await addWiki(root, wikiDir, { id: 'cn' });

    const config = await readWorkspaceConfig(root);
    const report = await collectDiscover(root, config);
    const wiki = report.wiki[0];
    assert.ok(wiki.outline.pages.some((p) => p.path.endsWith('架构.md')));
    assert.ok(wiki.outline.tree.children?.some((n) => n.name === '架构.md' && n.type === 'page'));
    assert.match(formatDiscover(report), /架构\.md/);
  });

  it('treats wiki entry root with README as a single logical project', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const wikiDir = path.join(cwd, 'one-wiki');
    await writeFile(path.join(wikiDir, 'README.md'), '# one\n');
    await writeFile(path.join(wikiDir, 'guide.md'), '# guide\n');
    await addWiki(root, wikiDir, { id: 'one' });

    const config = await readWorkspaceConfig(root);
    const report = await collectDiscover(root, config);
    assert.equal(report.wiki[0].shape, 'single');
    assert.deepEqual(
      report.wiki[0].logicalProjects.map((p) => p.path),
      ['wiki/one'],
    );
  });

  it('does not require select-or-exclude of every managed source', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    const b = path.join(cwd, 'svc-b');
    await fsp.mkdir(a);
    await fsp.mkdir(b);
    await writeFile(path.join(a, 'pom.xml'), '<project/>\n');
    await writeFile(path.join(b, 'package.json'), '{}\n');
    await addSource(root, a, { id: 'svc-a' });
    await addSource(root, b, { id: 'svc-b' });

    const config = await readWorkspaceConfig(root);
    const report = await collectDiscover(root, config);
    assert.doesNotMatch(formatDiscover(report), /select or exclude/);
  });

  it('reports unregistered orphan directories under sources/ and wiki/', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    await fsp.mkdir(path.join(root, 'sources', 'stray'), { recursive: true });
    await fsp.mkdir(path.join(root, 'wiki', 'stray-w'), { recursive: true });

    const config = await readWorkspaceConfig(root);
    const report = await collectDiscover(root, config);
    assert.deepEqual(report.orphans.sources, ['stray']);
    assert.deepEqual(report.orphans.wiki, ['stray-w']);
  });

  it('status --json shape is serializable and includes resources', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const sourceDir = path.join(cwd, 'src');
    await fsp.mkdir(sourceDir);
    await writeFile(path.join(sourceDir, 'a.txt'), 'a\n');
    await addSource(root, sourceDir, { id: 'svc' });

    const config = await readWorkspaceConfig(root);
    const report = await collectStatus(root, config);
    const parsed = JSON.parse(formatStatusJson(report)) as {
      name: string;
      sources: Array<{ id: string; ok: boolean }>;
    };
    assert.equal(parsed.name, 'ws');
    assert.equal(parsed.sources.length, 1);
    assert.equal(parsed.sources[0].id, 'svc');
    assert.equal(parsed.sources[0].ok, true);
  });
});
