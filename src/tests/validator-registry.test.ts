import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { initWorkspace } from '../workspace/init.js';
import { addSource, addWiki } from '../resources/source.js';
import { makeTempDir, writeFile } from './helpers.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const validatorScript = path.join(repoRoot, 'skill/ba2md/scripts/validate_artifacts.py');

function runValidator(workspace: string, productDir: string): {
  code: number | null;
  stdout: string;
} {
  const result = spawnSync(
    'python3',
    [validatorScript, '--workspace', workspace, '--product-dir', productDir, '--mode', 'plan'],
    { encoding: 'utf8' },
  );
  return {
    code: result.status,
    stdout: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
}

function planTables(options: {
  sources: Array<{ id: string; sources: string; wiki?: string }>;
  impact: Array<{ id: string; decision: string; reason: string }>;
}): string {
  const sourceRows = options.sources
    .map((s) => `| ${s.id} | ${s.sources} | ${s.wiki ?? ''} | owner | basis |`)
    .join('\n');
  const impactRows = options.impact
    .map((s) => `| ${s.id} | owner | signal | basis | impact | ${s.decision} | ${s.reason} |`)
    .join('\n');
  const owning = options.sources[0]?.id ?? 'svc-a';
  return `# Research Plan

## Selected Sources
| Source ID | Sources root | Wiki coverage | Role in requirement | Selection basis |
|-----------|--------------|---------------|---------------------|-----------------|
${sourceRows}

## Candidate Source Impact Map
| Source ID | Role | Requirement signals | Wiki/source basis | Expected impact | Decision | Exclusion reason |
|-----------|------|---------------------|-------------------|-----------------|----------|------------------|
${impactRows}

## Requirement-to-Source Coverage
| Requirement ID | Owning source | Supporting sources | Status | Notes |
|----------------|---------------|--------------------|--------|-------|
| R-FEAT-001 | ${owning} | | covered | |

## Cross-Source Boundary Coverage
| Boundary ID | Caller/producer source | Provider/consumer source | Boundary | Status | Evidence/GAP |
|-------------|------------------------|--------------------------|----------|--------|--------------|
`;
}

describe('validate_artifacts registry coverage', () => {
  it('rejects a bare sources/ root', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const sourceDir = path.join(cwd, 'svc');
    await fsp.mkdir(sourceDir);
    await writeFile(path.join(sourceDir, 'a.txt'), 'a\n');
    await addSource(root, sourceDir, { id: 'svc' });

    const productDir = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(productDir, { recursive: true });
    await writeFile(
      path.join(productDir, 'research-plan.md'),
      planTables({
        sources: [{ id: 'svc', sources: 'sources/' }],
        impact: [{ id: 'svc', decision: 'SELECT', reason: '-' }],
      }),
    );

    const result = runValidator(root, productDir);
    assert.notEqual(result.code, 0);
    assert.match(result.stdout, /bare collection root/i);
  });

  it('fails when a registered source id is omitted from the plan', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'a');
    const b = path.join(cwd, 'b');
    const wikiDir = path.join(cwd, 'w');
    await fsp.mkdir(a);
    await fsp.mkdir(b);
    await fsp.mkdir(wikiDir);
    await writeFile(path.join(a, 'a.txt'), 'a\n');
    await writeFile(path.join(b, 'b.txt'), 'b\n');
    await writeFile(path.join(wikiDir, 'README.md'), '# w\n');
    await addSource(root, a, { id: 'svc-a' });
    await addSource(root, b, { id: 'svc-b' });
    await addWiki(root, wikiDir, { id: 'docs' });

    const productDir = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(productDir, { recursive: true });
    await writeFile(
      path.join(productDir, 'research-plan.md'),
      planTables({
        sources: [{ id: 'svc-a', sources: 'sources/svc-a', wiki: 'wiki/docs' }],
        impact: [{ id: 'svc-a', decision: 'SELECT', reason: '-' }],
      }),
    );

    const result = runValidator(root, productDir);
    assert.notEqual(result.code, 0);
    assert.match(result.stdout, /svc-b/);
  });

  it('passes when every managed source is selected or excluded and the wiki is referenced', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'a');
    const b = path.join(cwd, 'b');
    const wikiDir = path.join(cwd, 'w');
    await fsp.mkdir(a);
    await fsp.mkdir(b);
    await fsp.mkdir(wikiDir);
    await writeFile(path.join(a, 'a.txt'), 'a\n');
    await writeFile(path.join(b, 'b.txt'), 'b\n');
    await writeFile(path.join(wikiDir, 'README.md'), '# w\n');
    await addSource(root, a, { id: 'svc-a' });
    await addSource(root, b, { id: 'svc-b' });
    await addWiki(root, wikiDir, { id: 'docs' });

    const productDir = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(productDir, { recursive: true });
    await writeFile(
      path.join(productDir, 'research-plan.md'),
      planTables({
        sources: [{ id: 'svc-a', sources: 'sources/svc-a', wiki: 'wiki/docs' }],
        impact: [
          { id: 'svc-a', decision: 'SELECT', reason: '-' },
          { id: 'svc-b', decision: 'EXCLUDE', reason: 'not in requirement path' },
        ],
      }),
    );

    const result = runValidator(root, productDir);
    assert.equal(result.code, 0, result.stdout);
    assert.match(result.stdout, /PASSED/);
  });
});
