import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import YAML from 'yaml';
import { initWorkspace } from '../workspace/init.js';
import { addSource } from '../resources/source.js';
import { checkProduct, formatCheck } from '../diagnostics/check.js';
import { sha256Text } from '../diagnostics/progress.js';
import { makeTempDir, writeFile } from './helpers.js';

async function productDir(root: string): Promise<string> {
  const dir = path.join(root, 'product', 'demo-sdd');
  await fsp.mkdir(dir, { recursive: true });
  return dir;
}

function progressDoc(overrides: Record<string, unknown> = {}): string {
  const base = {
    version: 1,
    slug: 'demo-sdd',
    node: 'analyze',
    waiting_for: 'none',
    intake: {
      requirement_path: '',
      requirement_sha256: '',
      named_sources: false,
    },
    confirmed_sources: [],
    research: { open: [], accepted: 0 },
    draft: { path: '', sha256: '' },
    review: {
      round: 0,
      last_result: 'none',
      draft_sha256: '',
      files: {},
    },
    final: false,
  };
  return YAML.stringify({ ...base, ...overrides });
}

describe('ba2md check', () => {
  it('passes an empty product directory without progress.yaml', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    await productDir(root);

    const report = await checkProduct(root, 'product/demo-sdd');
    assert.equal(report.ok, true, formatCheck(report));
  });

  it('fails when a draft exists but progress.yaml is missing', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const dir = await productDir(root);
    await writeFile(path.join(dir, 'demo-sdd.draft.md'), '# draft\n');

    const report = await checkProduct(root, 'product/demo-sdd');
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((e) => /progress\.yaml is missing/.test(e)));
  });

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

  it('fails when progress.yaml accepted research has empty briefs/', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const dir = await productDir(root);
    await writeFile(
      path.join(dir, 'progress.yaml'),
      progressDoc({ node: 'research', research: { open: [], accepted: 1 } }),
    );

    const report = await checkProduct(root, 'product/demo-sdd');
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((e) => /briefs\/ is empty/.test(e)));
  });

  it('fails when a 研究单元 row is done and briefs/ is empty', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const dir = await productDir(root);
    await writeFile(
      path.join(dir, 'research-plan.md'),
      `# Research Plan

## 研究单元
| Unit ID | Trigger | Source ID | Questions | Brief path | Status |
|---------|---------|-----------|-----------|------------|--------|
| U-AUTH-001 | req | svc-a | how? | \`briefs/U-AUTH-001.md\` | done |
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

  it('passes when node is draft with a brief and no reviews', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const dir = await productDir(root);
    await fsp.mkdir(path.join(dir, 'briefs'), { recursive: true });
    const draft = '# draft\n';
    await writeFile(path.join(dir, 'briefs', 'U-AUTH-001.md'), '# brief\n');
    await writeFile(path.join(dir, 'demo-sdd.draft.md'), draft);
    await writeFile(
      path.join(dir, 'progress.yaml'),
      progressDoc({
        node: 'draft',
        research: { open: [], accepted: 1 },
        draft: { path: 'demo-sdd.draft.md', sha256: sha256Text(draft) },
      }),
    );

    const report = await checkProduct(root, 'product/demo-sdd');
    assert.equal(report.ok, true, formatCheck(report));
    assert.match(formatCheck(report), /Node: draft round=0 last_result=none hashes=none/);
  });

  it('passes wait when DELIVER, hashes match, and review files exist', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const dir = await productDir(root);
    await fsp.mkdir(path.join(dir, 'briefs'), { recursive: true });
    await fsp.mkdir(path.join(dir, 'reviews'), { recursive: true });
    const draft = '# draft\n';
    const hash = sha256Text(draft);
    await writeFile(path.join(dir, 'briefs', 'U-AUTH-001.md'), '# brief\n');
    await writeFile(path.join(dir, 'demo-sdd.draft.md'), draft);
    await writeFile(path.join(dir, 'reviews', 'content-review-1-structure.md'), 'Result: DELIVER\n');
    await writeFile(path.join(dir, 'reviews', 'content-review-1-evidence.md'), 'Result: DELIVER\n');
    await writeFile(
      path.join(dir, 'progress.yaml'),
      progressDoc({
        node: 'wait',
        waiting_for: 'user',
        research: { open: [], accepted: 1 },
        draft: { path: 'demo-sdd.draft.md', sha256: hash },
        review: {
          round: 2,
          last_result: 'DELIVER',
          draft_sha256: hash,
          files: {
            structure: 'reviews/content-review-1-structure.md',
            evidence: 'reviews/content-review-1-evidence.md',
          },
        },
      }),
    );

    const report = await checkProduct(root, 'product/demo-sdd');
    assert.equal(report.ok, true, formatCheck(report));
    assert.match(formatCheck(report), /Node: wait round=2 last_result=DELIVER hashes=match/);
  });

  it('fails wait when DELIVER but draft hash no longer matches', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const dir = await productDir(root);
    await fsp.mkdir(path.join(dir, 'reviews'), { recursive: true });
    const draft = '# draft changed\n';
    const oldHash = sha256Text('# draft\n');
    await writeFile(path.join(dir, 'demo-sdd.draft.md'), draft);
    await writeFile(path.join(dir, 'reviews', 'content-review-1-structure.md'), 'Result: DELIVER\n');
    await writeFile(path.join(dir, 'reviews', 'content-review-1-evidence.md'), 'Result: DELIVER\n');
    await writeFile(
      path.join(dir, 'progress.yaml'),
      progressDoc({
        node: 'wait',
        draft: { path: 'demo-sdd.draft.md', sha256: oldHash },
        review: {
          round: 1,
          last_result: 'DELIVER',
          draft_sha256: oldHash,
          files: {
            structure: 'reviews/content-review-1-structure.md',
            evidence: 'reviews/content-review-1-evidence.md',
          },
        },
      }),
    );

    const report = await checkProduct(root, 'product/demo-sdd');
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((e) => /stale/.test(e)));
  });

  it('fails wait when last_result is WRITE', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const dir = await productDir(root);
    const draft = '# draft\n';
    const hash = sha256Text(draft);
    await writeFile(path.join(dir, 'demo-sdd.draft.md'), draft);
    await writeFile(
      path.join(dir, 'progress.yaml'),
      progressDoc({
        node: 'wait',
        draft: { path: 'demo-sdd.draft.md', sha256: hash },
        review: {
          round: 1,
          last_result: 'WRITE',
          draft_sha256: hash,
          files: {
            structure: 'reviews/content-review-1-structure.md',
            evidence: 'reviews/content-review-1-evidence.md',
          },
        },
      }),
    );

    const report = await checkProduct(root, 'product/demo-sdd');
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((e) => /requires review\.last_result DELIVER/.test(e)));
  });

  it('fails when final is true but the final document is missing', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const dir = await productDir(root);
    await fsp.mkdir(path.join(dir, 'reviews'), { recursive: true });
    const draft = '# draft\n';
    const hash = sha256Text(draft);
    await writeFile(path.join(dir, 'demo-sdd.draft.md'), draft);
    await writeFile(path.join(dir, 'reviews', 'content-review-1-structure.md'), 'Result: DELIVER\n');
    await writeFile(path.join(dir, 'reviews', 'content-review-1-evidence.md'), 'Result: DELIVER\n');
    await writeFile(
      path.join(dir, 'progress.yaml'),
      progressDoc({
        node: 'final',
        final: true,
        draft: { path: 'demo-sdd.draft.md', sha256: hash },
        review: {
          round: 1,
          last_result: 'DELIVER',
          draft_sha256: hash,
          files: {
            structure: 'reviews/content-review-1-structure.md',
            evidence: 'reviews/content-review-1-evidence.md',
          },
        },
      }),
    );

    const report = await checkProduct(root, 'product/demo-sdd');
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((e) => /final document missing: demo-sdd\.md/.test(e)));
  });

  it('fails when node enum is invalid', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const dir = await productDir(root);
    await writeFile(
      path.join(dir, 'progress.yaml'),
      `version: 1
slug: demo-sdd
node: handoff
waiting_for: none
`,
    );

    const report = await checkProduct(root, 'product/demo-sdd');
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((e) => /invalid progress\.yaml: node/.test(e)));
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
    const draft = '# draft\n';
    await writeFile(path.join(dir, 'demo-sdd.draft.md'), draft);
    await writeFile(
      path.join(dir, 'progress.yaml'),
      progressDoc({
        node: 'draft',
        draft: { path: 'demo-sdd.draft.md', sha256: sha256Text(draft) },
      }),
    );

    const report = await checkProduct(root, 'product/demo-sdd');
    assert.equal(report.ok, true, formatCheck(report));
    assert.doesNotMatch(formatCheck(report), /svc-b/);
  });
});
