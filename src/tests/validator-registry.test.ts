import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { initWorkspace } from '../workspace/init.js';
import { addSource } from '../resources/source.js';
import { makeTempDir, writeFile } from './helpers.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const validatorScript = path.join(repoRoot, 'skill/ba2md/scripts/validate_artifacts.py');

interface ValidatorResult {
  code: number | null;
  stdout: string;
}

function runValidator(
  workspace: string,
  productDir: string,
  mode = 'all',
): ValidatorResult {
  const result = spawnSync(
    'python3',
    [validatorScript, '--workspace', workspace, '--product-dir', productDir, '--mode', mode],
    { encoding: 'utf8' },
  );
  return {
    code: result.status,
    stdout: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
}

function requirementInput(id: string): string {
  return `| ${id} | Main | \`requirements/req.md\` | | VERIFIED | |`;
}

function requirementFileContent(): string {
  return `# Requirement

The system shall validate evidence anchors against real source files.
`;
}

function evidenceRow(opts: {
  id: string;
  label: string;
  status: string;
  anchor: string;
  verifiedBy?: string;
}): string {
  const scope = opts.id.split('-')[1] ?? 'X';
  return `| ${opts.id} | ${opts.label} | ${opts.status} | ${scope} | claim | code | \`${opts.anchor}\` | | | ${opts.verifiedBy ?? ''} |`;
}

function registryDoc(parts: {
  evidence?: string[];
  claims?: string[];
  issues?: string[];
  includeClaimsHeader?: boolean;
  includeIssuesHeader?: boolean;
}): string {
  const evidence = (parts.evidence ?? []).join('\n');
  const claims = parts.includeClaimsHeader === false ? '' : [
    '## Design Claims',
    '',
    '| Claim ID | Label | Status | Claim | Basis Evidence IDs | Alternatives and rationale | Supported sections |',
    '|----------|-------|--------|-------|--------------------|----------------------------|--------------------|',
    (parts.claims ?? []).join('\n'),
  ].join('\n');
  const issues = parts.includeIssuesHeader === false ? '' : [
    '## Issue Register',
    '',
    '| Issue ID | Label | Critical | Status | Description | Evidence IDs | Impact | Validation or resolution | Owner | Supported sections |',
    '|----------|-------|----------|--------|-------------|--------------|--------|--------------------------|-------|--------------------|',
    (parts.issues ?? []).join('\n'),
  ].join('\n');
  return `# Evidence Registry

## Requirement Inputs

| Requirement ID | Main/Supporting | Path | SHA-256 | Status | Selection basis |
|----------------|-----------------|------|---------|--------|-----------------|
${requirementInput('R-REQ-001')}

## Evidence Records

| Evidence ID | Label | Status | Scope ID | Claim | Source type | Exact anchor | Symbol | Supported sections | Verified by |
|-------------|-------|--------|----------|-------|-------------|--------------|--------|--------------------|-------------|
${evidence}

${claims}

${issues}
`;
}

function draftDoc(): string {
  return `---
status: draft
---

# Draft

Verified claim based on F-SVCA-001.
`;
}

function makeRequirement(workspace: string): Promise<void> {
  return writeFile(path.join(workspace, 'requirements', 'req.md'), requirementFileContent());
}

describe('validate_artifacts', () => {
  it('passes when only one source is used and other registered sources are unmentioned', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    const b = path.join(cwd, 'svc-b');
    await fsp.mkdir(a);
    await fsp.mkdir(b);
    await writeFile(path.join(a, 'Foo.java'), 'class Foo {}\n');
    await writeFile(path.join(b, 'Other.java'), 'class Other {}\n');
    await addSource(root, a, { id: 'svc-a' });
    await addSource(root, b, { id: 'svc-b' });
    await makeRequirement(root);

    const product = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(product, { recursive: true });
    await writeFile(
      path.join(product, 'evidence-registry.md'),
      registryDoc({
        evidence: [
          evidenceRow({
            id: 'F-SVCA-001',
            label: 'FACT',
            status: 'VERIFIED',
            anchor: 'sources/svc-a/Foo.java:1',
            verifiedBy: 'main agent',
          }),
        ],
      }),
    );
    await writeFile(path.join(product, 'demo-sdd.draft.md'), draftDoc());

    const result = runValidator(root, product, 'draft');
    assert.equal(result.code, 0, result.stdout);
    assert.doesNotMatch(result.stdout, /svc-b/);
  });

  it('fails when a VERIFIED FACT anchor points to a missing file', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    await fsp.mkdir(a);
    await writeFile(path.join(a, 'Foo.java'), 'class Foo {}\n');
    await addSource(root, a, { id: 'svc-a' });
    await makeRequirement(root);

    const product = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(product, { recursive: true });
    await writeFile(
      path.join(product, 'evidence-registry.md'),
      registryDoc({
        evidence: [
          evidenceRow({
            id: 'F-SVCA-001',
            label: 'FACT',
            status: 'VERIFIED',
            anchor: 'sources/svc-a/Missing.java:1',
            verifiedBy: 'main agent',
          }),
        ],
      }),
    );
    await writeFile(path.join(product, 'demo-sdd.draft.md'), draftDoc());

    const result = runValidator(root, product, 'draft');
    assert.notEqual(result.code, 0);
    assert.match(result.stdout, /Missing\.java|does not exist/i);
  });

  it('fails when a VERIFIED FACT has no Verified by', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    await fsp.mkdir(a);
    await writeFile(path.join(a, 'Foo.java'), 'class Foo {}\n');
    await addSource(root, a, { id: 'svc-a' });
    await makeRequirement(root);

    const product = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(product, { recursive: true });
    await writeFile(
      path.join(product, 'evidence-registry.md'),
      registryDoc({
        evidence: [
          evidenceRow({
            id: 'F-SVCA-001',
            label: 'FACT',
            status: 'VERIFIED',
            anchor: 'sources/svc-a/Foo.java:1',
          }),
        ],
      }),
    );
    await writeFile(path.join(product, 'demo-sdd.draft.md'), draftDoc());

    const result = runValidator(root, product, 'draft');
    assert.notEqual(result.code, 0);
    assert.match(result.stdout, /missing Verified by/i);
  });

  it('fails when a draft references an unknown evidence ID', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    await fsp.mkdir(a);
    await writeFile(path.join(a, 'Foo.java'), 'class Foo {}\n');
    await addSource(root, a, { id: 'svc-a' });
    await makeRequirement(root);

    const product = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(product, { recursive: true });
    await writeFile(
      path.join(product, 'evidence-registry.md'),
      registryDoc({
        evidence: [
          evidenceRow({
            id: 'F-SVCA-001',
            label: 'FACT',
            status: 'VERIFIED',
            anchor: 'sources/svc-a/Foo.java:1',
            verifiedBy: 'main agent',
          }),
        ],
      }),
    );
    await writeFile(
      path.join(product, 'demo-sdd.draft.md'),
      `---
status: draft
---

# Draft

Bogus reference F-SVCA-999.
`,
    );

    const result = runValidator(root, product, 'draft');
    assert.notEqual(result.code, 0);
    assert.match(result.stdout, /F-SVCA-999/);
  });

  it('passes in draft even when Design Claims and Issue tables are absent (warnings only)', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    await fsp.mkdir(a);
    await writeFile(path.join(a, 'Foo.java'), 'class Foo {}\n');
    await addSource(root, a, { id: 'svc-a' });
    await makeRequirement(root);

    const product = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(product, { recursive: true });
    // Registry with Evidence Records only — no Design Claims / Issue Register sections.
    await writeFile(
      path.join(product, 'evidence-registry.md'),
      `# Evidence Registry

## Requirement Inputs

| Requirement ID | Main/Supporting | Path | SHA-256 | Status | Selection basis |
|----------------|-----------------|------|---------|--------|-----------------|
${requirementInput('R-REQ-001')}

## Evidence Records

| Evidence ID | Label | Status | Scope ID | Claim | Source type | Exact anchor | Symbol | Supported sections | Verified by |
|-------------|-------|--------|----------|-------|-------------|--------------|--------|--------------------|-------------|
${evidenceRow({
  id: 'F-SVCA-001',
  label: 'FACT',
  status: 'VERIFIED',
  anchor: 'sources/svc-a/Foo.java:1',
  verifiedBy: 'main agent',
})}
`,
    );
    await writeFile(path.join(product, 'demo-sdd.draft.md'), draftDoc());

    const result = runValidator(root, product, 'draft');
    assert.equal(result.code, 0, result.stdout);
    assert.match(result.stdout, /PASSED/);
  });

  it('fails on a bare sources/ root in a research-plan Selected Sources row', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    await fsp.mkdir(a);
    await writeFile(path.join(a, 'Foo.java'), 'class Foo {}\n');
    await addSource(root, a, { id: 'svc-a' });

    const product = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(product, { recursive: true });
    await writeFile(
      path.join(product, 'research-plan.md'),
      `# Research Plan

## Selected Sources
| Source ID | Sources root | Wiki coverage | Role in requirement | Selection basis |
|-----------|--------------|---------------|---------------------|-----------------|
| svc-a | sources/ | | owner | name match |
`,
    );

    const result = runValidator(root, product, 'plan');
    assert.notEqual(result.code, 0);
    assert.match(result.stdout, /bare collection root/i);
  });

  it('fails when a final candidate leaves a critical GAP open', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    await fsp.mkdir(a);
    await writeFile(path.join(a, 'Foo.java'), 'class Foo {}\n');
    await addSource(root, a, { id: 'svc-a' });
    await makeRequirement(root);

    const product = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(product, { recursive: true });
    await writeFile(
      path.join(product, 'evidence-registry.md'),
      registryDoc({
        evidence: [
          evidenceRow({
            id: 'F-SVCA-001',
            label: 'FACT',
            status: 'VERIFIED',
            anchor: 'sources/svc-a/Foo.java:1',
            verifiedBy: 'main agent',
          }),
        ],
        issues: [
          '| G-FEAT-001 | GAP | Yes | OPEN | missing rollback plan | F-SVCA-001 | blocks final | | owner | 3.2 |',
        ],
      }),
    );
    await writeFile(
      path.join(product, 'demo-sdd.md'),
      `---
status: final
---

# Final

Done per F-SVCA-001.
`,
    );

    const result = runValidator(root, product, 'final');
    assert.notEqual(result.code, 0);
    assert.match(result.stdout, /G-FEAT-001/i);
  });

  it('fails draft when accepted research units > 0 and briefs/ is empty', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    await fsp.mkdir(a);
    await writeFile(path.join(a, 'Foo.java'), 'class Foo {}\n');
    await addSource(root, a, { id: 'svc-a' });
    await makeRequirement(root);

    const product = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(product, { recursive: true });
    await writeFile(
      path.join(product, 'research-plan.md'),
      `# Research Plan

## Execution State
- Accepted research units: 1
`,
    );
    await writeFile(
      path.join(product, 'evidence-registry.md'),
      registryDoc({
        evidence: [
          evidenceRow({
            id: 'F-SVCA-001',
            label: 'FACT',
            status: 'VERIFIED',
            anchor: 'sources/svc-a/Foo.java:1',
            verifiedBy: 'main agent',
          }),
        ],
      }),
    );
    await writeFile(path.join(product, 'demo-sdd.draft.md'), draftDoc());

    const result = runValidator(root, product, 'draft');
    assert.notEqual(result.code, 0, result.stdout);
    assert.match(result.stdout, /Research units accepted but briefs\/ is empty/i);
  });

  it('fails draft when Research Units table has done-like status and briefs/ is empty', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    await fsp.mkdir(a);
    await writeFile(path.join(a, 'Foo.java'), 'class Foo {}\n');
    await addSource(root, a, { id: 'svc-a' });
    await makeRequirement(root);

    const product = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(product, { recursive: true });
    await writeFile(
      path.join(product, 'research-plan.md'),
      `# Research Plan

## Research Units
| Unit ID | Trigger | Source ID / Boundary | Concern | Questions | Expected facts | Brief path | Dependencies | Status |
|---------|---------|----------------------|---------|-----------|----------------|------------|--------------|--------|
| U-AUTH-001 | req | svc-a | auth | how? | tokens | \`briefs/U-AUTH-001.md\` | | ready-for-acceptance |
`,
    );
    await writeFile(
      path.join(product, 'evidence-registry.md'),
      registryDoc({
        evidence: [
          evidenceRow({
            id: 'F-SVCA-001',
            label: 'FACT',
            status: 'VERIFIED',
            anchor: 'sources/svc-a/Foo.java:1',
            verifiedBy: 'main agent',
          }),
        ],
      }),
    );
    await writeFile(path.join(product, 'demo-sdd.draft.md'), draftDoc());

    const result = runValidator(root, product, 'draft');
    assert.notEqual(result.code, 0, result.stdout);
    assert.match(result.stdout, /Research units accepted but briefs\/ is empty/i);
  });

  it('passes draft when accepted units > 0 and one brief exists', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    await fsp.mkdir(a);
    await writeFile(path.join(a, 'Foo.java'), 'class Foo {}\n');
    await addSource(root, a, { id: 'svc-a' });
    await makeRequirement(root);

    const product = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(path.join(product, 'briefs'), { recursive: true });
    await fsp.mkdir(path.join(product, 'reviews'), { recursive: true });
    await writeFile(
      path.join(product, 'research-plan.md'),
      `# Research Plan

## Execution State
- Accepted research units: 1
`,
    );
    await writeFile(
      path.join(product, 'briefs', 'U-AUTH-001.md'),
      `# Brief U-AUTH-001

## Evidence Candidates
| Candidate ID | Label | Status | Exact raw anchor |
|--------------|-------|--------|------------------|
`,
    );
    await writeFile(
      path.join(product, 'reviews', 'content-review-1-comprehensive.md'),
      `# Content Review Report

- Content Review result: PASS
`,
    );
    await writeFile(
      path.join(product, 'evidence-registry.md'),
      registryDoc({
        evidence: [
          evidenceRow({
            id: 'F-SVCA-001',
            label: 'FACT',
            status: 'VERIFIED',
            anchor: 'sources/svc-a/Foo.java:1',
            verifiedBy: 'main agent',
          }),
        ],
      }),
    );
    await writeFile(path.join(product, 'demo-sdd.draft.md'), draftDoc());

    const result = runValidator(root, product, 'draft');
    assert.equal(result.code, 0, result.stdout);
    assert.match(result.stdout, /PASSED/);
    assert.doesNotMatch(result.stdout, /briefs\/ is empty/i);
  });

  it('warns but passes when draft exists without Content Review signal', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    await fsp.mkdir(a);
    await writeFile(path.join(a, 'Foo.java'), 'class Foo {}\n');
    await addSource(root, a, { id: 'svc-a' });
    await makeRequirement(root);

    const product = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(product, { recursive: true });
    await writeFile(
      path.join(product, 'evidence-registry.md'),
      registryDoc({
        evidence: [
          evidenceRow({
            id: 'F-SVCA-001',
            label: 'FACT',
            status: 'VERIFIED',
            anchor: 'sources/svc-a/Foo.java:1',
            verifiedBy: 'main agent',
          }),
        ],
      }),
    );
    await writeFile(path.join(product, 'demo-sdd.draft.md'), draftDoc());

    const result = runValidator(root, product, 'draft');
    assert.equal(result.code, 0, result.stdout);
    assert.match(result.stdout, /WARNING:.*Content Review signal/i);
    assert.match(result.stdout, /PASSED/);
  });

  it('does not warn about Content Review when gate-report has a filled result', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    await fsp.mkdir(a);
    await writeFile(path.join(a, 'Foo.java'), 'class Foo {}\n');
    await addSource(root, a, { id: 'svc-a' });
    await makeRequirement(root);

    const product = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(product, { recursive: true });
    await writeFile(
      path.join(product, 'gate-report.md'),
      `# Quality Gate Report

- Content Review result: PASS_WITH_DISCUSSION
`,
    );
    await writeFile(
      path.join(product, 'evidence-registry.md'),
      registryDoc({
        evidence: [
          evidenceRow({
            id: 'F-SVCA-001',
            label: 'FACT',
            status: 'VERIFIED',
            anchor: 'sources/svc-a/Foo.java:1',
            verifiedBy: 'main agent',
          }),
        ],
      }),
    );
    await writeFile(path.join(product, 'demo-sdd.draft.md'), draftDoc());

    const result = runValidator(root, product, 'draft');
    assert.equal(result.code, 0, result.stdout);
    assert.doesNotMatch(result.stdout, /no Content Review signal/i);
  });

  it('warns on unfilled Yes/No Content Review template row when no reviews exist', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    await fsp.mkdir(a);
    await writeFile(path.join(a, 'Foo.java'), 'class Foo {}\n');
    await addSource(root, a, { id: 'svc-a' });
    await makeRequirement(root);

    const product = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(product, { recursive: true });
    await writeFile(
      path.join(product, 'gate-report.md'),
      `# Quality Gate Report

## 2. Content Review (primary)

- Content Review result: PASS / PASS_WITH_DISCUSSION / RESEARCH_REQUIRED / REVISION_REQUIRED / RECONCILE_REQUIRED / BLOCKED

| Metric | Result |
|--------|--------|
| Content Review completed this gate | Yes/No |
| User-led review handoff authorized | Yes/No |
`,
    );
    await writeFile(
      path.join(product, 'evidence-registry.md'),
      registryDoc({
        evidence: [
          evidenceRow({
            id: 'F-SVCA-001',
            label: 'FACT',
            status: 'VERIFIED',
            anchor: 'sources/svc-a/Foo.java:1',
            verifiedBy: 'main agent',
          }),
        ],
      }),
    );
    await writeFile(path.join(product, 'demo-sdd.draft.md'), draftDoc());

    const result = runValidator(root, product, 'draft');
    assert.equal(result.code, 0, result.stdout);
    assert.match(result.stdout, /WARNING:.*Content Review signal/i);
  });

  it('accepts pure Yes Content Review completed cell as a valid signal', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    await fsp.mkdir(a);
    await writeFile(path.join(a, 'Foo.java'), 'class Foo {}\n');
    await addSource(root, a, { id: 'svc-a' });
    await makeRequirement(root);

    const product = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(product, { recursive: true });
    await writeFile(
      path.join(product, 'gate-report.md'),
      `# Quality Gate Report

| Metric | Result |
|--------|--------|
| Content Review completed this gate | Yes |
`,
    );
    await writeFile(
      path.join(product, 'evidence-registry.md'),
      registryDoc({
        evidence: [
          evidenceRow({
            id: 'F-SVCA-001',
            label: 'FACT',
            status: 'VERIFIED',
            anchor: 'sources/svc-a/Foo.java:1',
            verifiedBy: 'main agent',
          }),
        ],
      }),
    );
    await writeFile(path.join(product, 'demo-sdd.draft.md'), draftDoc());

    const result = runValidator(root, product, 'draft');
    assert.equal(result.code, 0, result.stdout);
    assert.doesNotMatch(result.stdout, /no Content Review signal/i);
  });

  it('still does not fail solely because Selected Sources is incomplete', async () => {
    const cwd = await makeTempDir();
    const { root } = await initWorkspace('ws', cwd);
    const a = path.join(cwd, 'svc-a');
    const b = path.join(cwd, 'svc-b');
    await fsp.mkdir(a);
    await fsp.mkdir(b);
    await writeFile(path.join(a, 'Foo.java'), 'class Foo {}\n');
    await writeFile(path.join(b, 'Other.java'), 'class Other {}\n');
    await addSource(root, a, { id: 'svc-a' });
    await addSource(root, b, { id: 'svc-b' });
    await makeRequirement(root);

    const product = path.join(root, 'product', 'demo-sdd');
    await fsp.mkdir(path.join(product, 'reviews'), { recursive: true });
    await writeFile(
      path.join(product, 'research-plan.md'),
      `# Research Plan

## Selected Sources
| Source ID | Sources root | Wiki coverage | Role in requirement | Selection basis |
|-----------|--------------|---------------|---------------------|-----------------|
| svc-a | sources/svc-a | | owner | starting point |

## Execution State
- Accepted research units: 0
`,
    );
    await writeFile(
      path.join(product, 'reviews', 'content-review-1-comprehensive.md'),
      `# Content Review

- Content Review result: PASS
`,
    );
    await writeFile(
      path.join(product, 'evidence-registry.md'),
      registryDoc({
        evidence: [
          evidenceRow({
            id: 'F-SVCA-001',
            label: 'FACT',
            status: 'VERIFIED',
            anchor: 'sources/svc-a/Foo.java:1',
            verifiedBy: 'main agent',
          }),
        ],
      }),
    );
    await writeFile(path.join(product, 'demo-sdd.draft.md'), draftDoc());

    const result = runValidator(root, product, 'draft');
    assert.equal(result.code, 0, result.stdout);
    assert.doesNotMatch(result.stdout, /svc-b/);
    assert.doesNotMatch(result.stdout, /unmentioned|incomplete selection|must select/i);
  });
});
