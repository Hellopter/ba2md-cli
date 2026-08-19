import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { initWorkspace } from '../workspace/init.js';
import { addSource } from '../resources/source.js';
import { checkProduct, formatCheck } from '../diagnostics/check.js';
import { makeTempDir, writeFile } from './helpers.js';

async function productDir(root: string): Promise<string> {
  const dir = path.join(root, 'product', 'demo-sdd');
  await fsp.mkdir(dir, { recursive: true });
  return dir;
}

describe('ba2md check', () => {
  it('fails when accepted research has empty briefs/', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const dir = await productDir(root);
    await writeFile(
      path.join(dir, 'research-plan.md'),
      `# Research Plan

## Execution State
- Accepted research units: 1
`,
    );

    const report = await checkProduct(root, 'product/demo-sdd');
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((e) => /briefs\/ is empty/.test(e)));
  });

  it('fails when a Research Units row is done and briefs/ is empty', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const dir = await productDir(root);
    await writeFile(
      path.join(dir, 'research-plan.md'),
      `# Research Plan

## Research Units
| Unit ID | Trigger | Source ID / Boundary | Concern | Questions | Expected facts | Brief path | Dependencies | Status |
|---------|---------|----------------------|---------|-----------|----------------|------------|--------------|--------|
| U-AUTH-001 | req | svc-a | auth | how? | tokens | \`briefs/U-AUTH-001.md\` | | ready-for-acceptance |
`,
    );

    const report = await checkProduct(root, 'product/demo-sdd');
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((e) => /briefs\/ is empty/.test(e)));
  });

  it('passes when accepted units have a brief and a draft has a content-review file', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const dir = await productDir(root);
    await fsp.mkdir(path.join(dir, 'briefs'), { recursive: true });
    await fsp.mkdir(path.join(dir, 'reviews'), { recursive: true });
    await writeFile(
      path.join(dir, 'research-plan.md'),
      `# Research Plan

## Execution State
- Accepted research units: 1
`,
    );
    await writeFile(path.join(dir, 'briefs', 'U-AUTH-001.md'), '# brief\n');
    await writeFile(path.join(dir, 'reviews', 'content-review-1-comprehensive.md'), '# review\n');
    await writeFile(path.join(dir, 'demo-sdd.draft.md'), '# draft\n');

    const report = await checkProduct(root, 'product/demo-sdd');
    assert.equal(report.ok, true, formatCheck(report));
  });

  it('fails when a draft exists without a content-review file', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const dir = await productDir(root);
    await writeFile(path.join(dir, 'demo-sdd.draft.md'), '# draft\n');

    const report = await checkProduct(root, 'product/demo-sdd');
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((e) => /no content-review/.test(e)));
  });

  it('does not fail when other managed sources are unmentioned', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    const b = path.join(cwd, 'svc-b');
    await fsp.mkdir(a);
    await fsp.mkdir(b);
    await addSource(root, a, { id: 'svc-a' });
    await addSource(root, b, { id: 'svc-b' });
    const dir = await productDir(root);
    await fsp.mkdir(path.join(dir, 'reviews'), { recursive: true });
    await writeFile(path.join(dir, 'reviews', 'content-review-1.md'), '# review\n');
    await writeFile(path.join(dir, 'demo-sdd.draft.md'), '# draft\n');

    const report = await checkProduct(root, 'product/demo-sdd');
    assert.equal(report.ok, true, formatCheck(report));
    assert.doesNotMatch(formatCheck(report), /svc-b/);
  });
});
