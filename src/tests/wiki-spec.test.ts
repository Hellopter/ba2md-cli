import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  inspectWikiInventory,
  inspectWikiPlan,
  looksLikeWikiSpecV2,
  wikiSpecClusterId,
  wikiSpecDomainIds,
  wikiSpecPageType,
  wikiSpecSourceIds,
} from '../wiki/spec.js';

describe('wikiSpecPageType', () => {
  const cases: Array<[string, string | undefined]> = [
    ['overview.md', 'overview'],
    ['architecture.md', 'architecture'],
    ['billing/source.md', 'source'],
    ['billing/payments/domain.md', 'domain'],
    ['billing/payments/checkout/concept.md', 'concept'],
    ['billing/payments/checkout/models.md', 'data'],
    ['billing/payments/checkout/flows.md', 'flow'],
    ['billing/payments/checkout/sequences.md', 'flow'],
    ['billing/payments/checkout/states.md', 'state'],
    ['billing/payments/checkout/data.md', 'data'],
    ['billing/payments/checkout/modules.md', 'module'],
    ['billing/payments/checkout/models/invoice.md', 'data'],
    ['wiki/overview.md', 'overview'],
    ['README.md', undefined],
    ['billing/overview.md', undefined],
    ['index.md', undefined],
    ['billing/source.txt', undefined],
    ['billing/payments/checkout/concepts/x.md', undefined],
  ];

  for (const [path, expected] of cases) {
    it(`${path} → ${expected ?? 'undefined'}`, () => {
      assert.equal(wikiSpecPageType(path), expected);
    });
  }
});

describe('inspectWikiInventory', () => {
  it('accepts a complete v2 tree', () => {
    const pages = [
      'overview.md',
      'architecture.md',
      'billing/source.md',
      'billing/payments/domain.md',
      'billing/payments/checkout/concept.md',
      'orders/source.md',
      'orders/checkout/domain.md',
    ];
    const result = inspectWikiInventory({ pages, topologyVersion: 2 });
    assert.deepEqual(result.defects, []);
    assert.deepEqual(result.spec?.pages, pages);
    assert.equal(result.spec?.topologyVersion, 2);
    assert.deepEqual(wikiSpecSourceIds(result.spec!), ['billing', 'orders']);
    assert.deepEqual(wikiSpecDomainIds(result.spec!), ['billing/payments', 'orders/checkout']);
  });

  it('keeps legal pages and records defects for an incomplete mount', () => {
    const result = inspectWikiInventory([
      'overview.md',
      'billing/payments/checkout/concept.md',
    ]);
    assert.ok(result.spec);
    assert.deepEqual(result.spec.pages, [
      'overview.md',
      'billing/payments/checkout/concept.md',
    ]);
    assert.ok(result.defects.some((d) => /missing source\.md for: billing/.test(d)));
    assert.ok(result.defects.some((d) => /missing domain\.md for: billing\/payments/.test(d)));
  });

  it('rejects wiki/ prefixes, duplicates, and unknown fields', () => {
    const result = inspectWikiInventory({
      pages: ['wiki/overview.md', 'overview.md', 'overview.md', 'notes.md'],
      extra: true,
    });
    assert.ok(result.defects.some((d) => /unknown fields: extra/.test(d)));
    assert.ok(result.defects.some((d) => /duplicate page paths: overview\.md/.test(d)));
    assert.ok(result.defects.some((d) => /illegal page paths: wiki\/overview\.md, notes\.md/.test(d)));
    assert.deepEqual(result.spec?.pages, ['overview.md']);
  });

  it('looksLikeWikiSpecV2 is true for overview or source.md', () => {
    assert.equal(looksLikeWikiSpecV2(['overview.md']), true);
    assert.equal(looksLikeWikiSpecV2(['billing/source.md']), true);
    assert.equal(looksLikeWikiSpecV2(['README.md', 'guide.md']), false);
  });

  it('assigns cluster ids', () => {
    assert.equal(wikiSpecClusterId('overview.md'), '_root');
    assert.equal(wikiSpecClusterId('billing/source.md'), 'billing/_source');
    assert.equal(wikiSpecClusterId('billing/payments/domain.md'), 'billing/payments');
    assert.equal(
      wikiSpecClusterId('billing/payments/checkout/flows.md'),
      'billing/payments/checkout',
    );
  });
});

describe('inspectWikiPlan', () => {
  const inventory = [
    'overview.md',
    'architecture.md',
    'billing/source.md',
    'billing/payments/domain.md',
    'billing/payments/checkout/concept.md',
    'orders/source.md',
    'orders/checkout/domain.md',
  ];

  it('accepts a subset that keeps overview.md and a source.md', () => {
    const result = inspectWikiPlan(
      {
        pages: ['overview.md', 'billing/source.md', 'billing/payments/domain.md'],
        topologyVersion: 2,
      },
      inventory,
    );
    assert.deepEqual(result.defects, []);
    assert.deepEqual(result.spec?.pages, [
      'overview.md',
      'billing/source.md',
      'billing/payments/domain.md',
    ]);
  });

  it('does not require every inventory domain.md', () => {
    const result = inspectWikiPlan(
      { pages: ['overview.md', 'orders/source.md'] },
      inventory,
    );
    assert.deepEqual(result.defects, []);
  });

  it('fails when a page is not in inventory', () => {
    const result = inspectWikiPlan(
      { pages: ['overview.md', 'billing/source.md', 'ghost/source.md'] },
      inventory,
    );
    assert.ok(result.defects.some((d) => /not in inventory: ghost\/source\.md/.test(d)));
    assert.equal(result.spec, undefined);
  });

  it('fails without source.md', () => {
    const result = inspectWikiPlan({ pages: ['overview.md'] }, inventory);
    assert.ok(result.defects.some((d) => /at least one source\.md/.test(d)));
  });

  it('fails when inventory has overview.md and the plan omits it', () => {
    const result = inspectWikiPlan({ pages: ['billing/source.md'] }, inventory);
    assert.ok(result.defects.some((d) => /must include overview\.md/.test(d)));
  });
});
