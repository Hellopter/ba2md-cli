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
  pairs: Array<{ id: string; wiki: string; sources: string }>;
  impact: Array<{ id: string; decision: string; reason: string }>;
}): string {
  const pairRows = options.pairs
    .map((p) => `| ${p.id} | ${p.wiki} | ${p.sources} | owner | name |`)
    .join('\n');
  const impactRows = options.impact
    .map((p) => `| ${p.id} | owner | signal | basis | impact | ${p.decision} | ${p.reason} |`)
    .join('\n');
  return `# Research Plan

## Selected Project Pairs
| Pair ID | Wiki root | Sources root | Role in requirement | Pair proof |
|---------|-----------|--------------|---------------------|------------|
${pairRows}

## Candidate Project Impact Map
| Pair ID | Role | Requirement signals | Wiki/source basis | Expected impact | Decision | Exclusion reason |
|---------|------|---------------------|-------------------|-----------------|----------|------------------|
${impactRows}

## Requirement-to-Project Coverage
| Requirement ID | Owning pair | Supporting pairs | Status | Notes |
|----------------|-------------|------------------|--------|-------|
| R-FEAT-001 | ${options.pairs[0]?.id ?? 'p1'} | | covered | |

## Cross-Project Boundary Coverage
| Boundary ID | Caller/producer pair | Provider/consumer pair | Boundary | Status | Evidence/GAP |
|-------------|----------------------|------------------------|----------|--------|--------------|
`;
}

describe('validate_artifacts registry coverage', () => {
  it('rejects bare wiki/ and sources/ pair roots', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const sourceDir = path.join(cwd, 'svc');
    const wikiDir = path.join(cwd, 'wiki-src');
    await fsp.mkdir(sourceDir);
    await fsp.mkdir(wikiDir);
    await writeFile(path.join(sourceDir, 'a.txt'), 'a\n');
    await writeFile(path.join(wikiDir, 'README.md'), '# w\n');
    await addSource(root, sourceDir, { id: 'svc' });
    await addWiki(root, wikiDir, { id: 'docs' });

    // Create real paths so existence checks pass if bare-root check fails first...
    // Bare roots wiki/ and sources/ exist as directories.
    const productDir = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(productDir, { recursive: true });
    await writeFile(
      path.join(productDir, 'research-plan.md'),
      planTables({
        pairs: [{ id: 'svc', wiki: 'wiki/', sources: 'sources/' }],
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
        pairs: [{ id: 'svc-a', wiki: 'wiki/docs', sources: 'sources/svc-a' }],
        impact: [{ id: 'svc-a', decision: 'SELECT', reason: '-' }],
      }),
    );

    const result = runValidator(root, productDir);
    assert.notEqual(result.code, 0);
    assert.match(result.stdout, /svc-b/);
  });

  it('passes when every managed id is selected or excluded', async () => {
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
        pairs: [{ id: 'svc-a', wiki: 'wiki/docs', sources: 'sources/svc-a' }],
        impact: [
          { id: 'svc-a', decision: 'SELECT', reason: '-' },
          { id: 'svc-b', decision: 'EXCLUDE', reason: 'not in requirement path' },
          { id: 'docs', decision: 'SELECT', reason: '-' },
        ],
      }),
    );

    const result = runValidator(root, productDir);
    assert.equal(result.code, 0, result.stdout);
    assert.match(result.stdout, /PASSED/);
  });
});
