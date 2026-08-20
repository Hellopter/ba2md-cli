import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  hashesStatus,
  parseProgressYaml,
  sha256Text,
} from '../diagnostics/progress.js';
import { packagedSkillRoot } from '../utils/paths.js';

const valid = `
version: 1
slug: demo-sdd
node: analyze
waiting_for: none
`;

describe('parseProgressYaml', () => {
  it('parses a minimal cursor and fills defaults', () => {
    const parsed = parseProgressYaml(valid);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.progress.slug, 'demo-sdd');
    assert.equal(parsed.progress.node, 'analyze');
    assert.equal(parsed.progress.review.last_result, 'none');
    assert.equal(parsed.progress.research.accepted, 0);
    assert.equal(parsed.progress.final, false);
  });

  it('rejects an unknown node', () => {
    const parsed = parseProgressYaml(`
version: 1
slug: demo-sdd
node: handoff
waiting_for: none
`);
    assert.equal(parsed.ok, false);
    if (parsed.ok) return;
    assert.ok(parsed.errors.some((e) => /invalid progress\.yaml: node/.test(e)));
  });

  it('rejects invalid YAML', () => {
    const parsed = parseProgressYaml('version: [');
    assert.equal(parsed.ok, false);
    if (parsed.ok) return;
    assert.ok(parsed.errors.some((e) => /invalid YAML/.test(e)));
  });

  it('parses the packaged template', async () => {
    const raw = await fsp.readFile(
      path.join(packagedSkillRoot(), 'assets', 'progress-template.yaml'),
      'utf8',
    );
    const parsed = parseProgressYaml(raw);
    assert.equal(parsed.ok, true, parsed.ok ? '' : parsed.errors.join('; '));
  });
});

describe('hashesStatus', () => {
  it('is none when both hashes are empty', () => {
    const parsed = parseProgressYaml(valid);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(hashesStatus(parsed.progress, undefined), 'none');
  });

  it('is match when file, draft, and review hashes agree', () => {
    const parsed = parseProgressYaml(valid);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    const hash = sha256Text('# draft\n');
    parsed.progress.draft.sha256 = hash;
    parsed.progress.review.draft_sha256 = hash;
    assert.equal(hashesStatus(parsed.progress, hash), 'match');
  });
});
