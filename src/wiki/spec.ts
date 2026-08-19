const TOPOLOGY_VERSION = 2 as const;
const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const PAGE_SLUG = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.md$/;
const TYPE_BUCKETS = new Set(['concepts', 'flows', 'states', 'data', 'modules']);
const CLUSTER_FILES: Readonly<Record<string, WikiSpecPageType>> = {
  'concept.md': 'concept',
  'models.md': 'data',
  'flows.md': 'flow',
  'sequences.md': 'flow',
  'states.md': 'state',
  'data.md': 'data',
  'modules.md': 'module',
};

export type WikiSpecPageType =
  | 'overview'
  | 'architecture'
  | 'source'
  | 'domain'
  | 'module'
  | 'flow'
  | 'concept'
  | 'state'
  | 'data';

export type WikiSpecPage = { path: string; pageType: WikiSpecPageType };

/** Wiki-relative authored paths, no wiki/ prefix; unique; input order preserved. */
export type WikiSpec = { pages: string[]; topologyVersion?: 2 };

export interface WikiInspectResult {
  defects: string[];
  spec?: WikiSpec;
}

export function isWikiSourceSegment(segment: string): boolean {
  return SLUG.test(segment);
}

export function wikiSpecRelativePath(pagePath: string): string {
  return pagePath.startsWith('wiki/') ? pagePath.slice('wiki/'.length) : pagePath;
}

/** Return the page type implied by a source-aware authored path. */
export function wikiSpecPageType(pagePath: string): WikiSpecPageType | undefined {
  const relative = wikiSpecRelativePath(pagePath);
  if (relative === 'overview.md') return 'overview';
  if (relative === 'architecture.md') return 'architecture';
  const segments = relative.split('/');
  if (segments.length === 2 && segments[1] === 'source.md' && isWikiSourceSegment(segments[0])) {
    return 'source';
  }
  if (
    segments.length === 3 &&
    segments[2] === 'domain.md' &&
    isWikiSourceSegment(segments[0]) &&
    SLUG.test(segments[1])
  ) {
    return 'domain';
  }
  if (segments.length < 4) return undefined;

  const [source, domain, concept] = segments;
  const tail = segments.slice(3).join('/');
  if (
    !isWikiSourceSegment(source) ||
    !SLUG.test(domain) ||
    !PAGE_SLUG.test(`${concept}.md`) ||
    TYPE_BUCKETS.has(concept)
  ) {
    return undefined;
  }
  if (CLUSTER_FILES[tail]) return CLUSTER_FILES[tail];
  if (tail.startsWith('models/') && PAGE_SLUG.test(tail.slice('models/'.length))) return 'data';
  return undefined;
}

export function wikiSpecPages(spec: WikiSpec): WikiSpecPage[] {
  return spec.pages.map((path) => ({ path, pageType: wikiSpecPageType(path)! }));
}

export function wikiSpecPagePaths(spec: WikiSpec): string[] {
  return spec.pages;
}

/** Extract the source namespace from any source/domain/concept page. */
export function wikiSpecSourceId(pagePath: string): string | undefined {
  const relative = wikiSpecRelativePath(pagePath);
  const pageType = wikiSpecPageType(relative);
  if (!pageType || pageType === 'overview' || pageType === 'architecture') return undefined;
  return relative.split('/')[0];
}

/** Extract the domain slug from a domain or concept page. */
export function wikiSpecDomainId(pagePath: string): string | undefined {
  const relative = wikiSpecRelativePath(pagePath);
  const pageType = wikiSpecPageType(relative);
  if (!pageType || pageType === 'overview' || pageType === 'architecture' || pageType === 'source') {
    return undefined;
  }
  return relative.split('/')[1];
}

/** Extract a collision-free source/domain key from a domain or concept page. */
export function wikiSpecDomainKey(pagePath: string): string | undefined {
  const source = wikiSpecSourceId(pagePath);
  const domain = wikiSpecDomainId(pagePath);
  return source && domain ? `${source}/${domain}` : undefined;
}

export function wikiSpecSourceIds(spec: WikiSpec): string[] {
  const ids = new Set<string>();
  for (const page of spec.pages) {
    const source = wikiSpecSourceId(page);
    if (source) ids.add(source);
  }
  return [...ids];
}

/**
 * Return qualified domain keys for a multi-source spec. Passing a source
 * filters the result and returns its local domain slugs.
 */
export function wikiSpecDomainIds(spec: WikiSpec, sourceId?: string): string[] {
  const ids = new Set<string>();
  for (const page of spec.pages) {
    const source = wikiSpecSourceId(page);
    const domain = wikiSpecDomainId(page);
    if (!source || !domain || (sourceId !== undefined && source !== sourceId)) continue;
    ids.add(sourceId === undefined ? `${source}/${domain}` : domain);
  }
  return [...ids];
}

export function wikiSpecClusterSourceId(clusterId: string): string | undefined {
  if (clusterId === '_root') return undefined;
  return clusterId.split('/')[0];
}

export function wikiSpecClusterParent(clusterId: string): string | undefined {
  if (clusterId === '_root') return undefined;
  const segments = clusterId.split('/');
  if (segments.length === 2 && segments[1] === '_source') return '_root';
  if (segments.length === 2) return `${segments[0]}/_source`;
  return segments.slice(0, -1).join('/');
}

export function wikiSpecClusterId(pagePath: string): string | undefined {
  const relative = wikiSpecRelativePath(pagePath);
  const pageType = wikiSpecPageType(relative);
  if (pageType === 'overview' || pageType === 'architecture') return '_root';
  if (pageType === 'source') return `${relative.split('/')[0]}/_source`;
  if (pageType === 'domain') return `${relative.split('/')[0]}/${relative.split('/')[1]}`;
  if (pageType && ['module', 'flow', 'concept', 'state', 'data'].includes(pageType)) {
    const segments = relative.split('/');
    return segments.slice(0, 3).join('/');
  }
  return undefined;
}

export function wikiSpecClusterPaths(spec: WikiSpec, clusterId: string): string[] {
  return wikiSpecPagePaths(spec).filter((pagePath) => wikiSpecClusterId(pagePath) === clusterId);
}

export function wikiSpecClusters(spec: WikiSpec): string[] {
  const clusters = new Set<string>();
  for (const pagePath of wikiSpecPagePaths(spec)) {
    const clusterId = wikiSpecClusterId(pagePath);
    if (clusterId) clusters.add(clusterId);
  }
  return [...clusters].sort();
}

export function sameWikiCluster(paths: readonly string[]): boolean {
  if (!paths.length) return false;
  const clusterId = wikiSpecClusterId(paths[0]);
  if (!clusterId) return false;
  return paths.every((pagePath) => wikiSpecClusterId(pagePath) === clusterId);
}

export function looksLikeWikiSpecV2(pages: readonly string[]): boolean {
  return pages.some((page) => {
    const type = wikiSpecPageType(page);
    return type === 'overview' || type === 'source';
  });
}

/**
 * Inspect an on-disk wiki inventory. Incomplete trees are defects, not a
 * hard reject — callers still get the legal pages.
 */
export function inspectWikiInventory(value: unknown): WikiInspectResult {
  return inspectWikiValue(value, { mode: 'inventory' });
}

/**
 * Inspect an agent-produced requirement wiki-plan. Pages must be topology-legal
 * and, when an inventory is supplied, a subset of it. A plan is a subset: it
 * does not need every inventory domain.md.
 */
export function inspectWikiPlan(value: unknown, inventoryPages: readonly string[] = []): WikiInspectResult {
  return inspectWikiValue(value, { mode: 'plan', inventoryPages });
}

function listed(items: readonly string[]): string {
  return [...items].join(', ');
}

function inspectWikiValue(
  value: unknown,
  options: { mode: 'inventory' | 'plan'; inventoryPages?: readonly string[] },
): WikiInspectResult {
  const parsed = parseWikiSpecShape(value);
  if (!parsed.pages) {
    return { defects: parsed.defects };
  }

  const defects = [...parsed.defects];
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const illegal: string[] = [];
  const legal: string[] = [];

  for (const page of parsed.pages) {
    if (seen.has(page)) {
      duplicates.push(page);
      continue;
    }
    seen.add(page);
    if (page !== wikiSpecRelativePath(page) || !wikiSpecPageType(page)) illegal.push(page);
    else legal.push(page);
  }

  if (duplicates.length) defects.push(`duplicate page paths: ${listed(duplicates)}`);
  if (illegal.length) defects.push(`illegal page paths: ${listed(illegal)}`);

  if (options.mode === 'plan') {
    const inventory = options.inventoryPages ?? [];
    if (inventory.length > 0) {
      const inventorySet = new Set(inventory);
      const missing = legal.filter((page) => !inventorySet.has(page));
      if (missing.length) defects.push(`wiki-plan pages not in inventory: ${listed(missing)}`);
      if (inventory.includes('overview.md') && !legal.includes('overview.md')) {
        defects.push('wiki-plan must include overview.md when the inventory has it');
      }
    }
    if (!legal.some((page) => wikiSpecPageType(page) === 'source')) {
      defects.push('wiki-plan must include at least one source.md');
    }
  } else {
    coverageDefects(legal, defects);
  }

  if (options.mode === 'plan' && defects.length) {
    return { defects };
  }

  return {
    defects,
    spec: {
      pages: legal,
      ...(parsed.topologyVersion === TOPOLOGY_VERSION ? { topologyVersion: TOPOLOGY_VERSION } : {}),
    },
  };
}

function parseWikiSpecShape(value: unknown): {
  defects: string[];
  pages?: string[];
  topologyVersion?: number;
} {
  if (Array.isArray(value)) {
    if (value.some((page) => typeof page !== 'string')) {
      return { defects: ['WikiSpec pages must be an array of strings'] };
    }
    return { defects: [], pages: [...value] };
  }
  if (value === null || typeof value !== 'object') {
    return { defects: ['WikiSpec must be an object'] };
  }
  const record = value as Record<string, unknown>;
  const defects: string[] = [];
  const extras = Object.keys(record).filter((key) => key !== 'pages' && key !== 'topologyVersion');
  if (extras.length) defects.push(`WikiSpec has unknown fields: ${listed(extras)}`);
  if (record.topologyVersion !== undefined && record.topologyVersion !== TOPOLOGY_VERSION) {
    defects.push('WikiSpec topologyVersion must be 2');
  }
  if (!('pages' in record)) {
    defects.push('WikiSpec missing fields: pages');
    return { defects };
  }
  const pages = record.pages;
  if (!Array.isArray(pages) || pages.some((page) => typeof page !== 'string')) {
    defects.push('WikiSpec pages must be an array of strings');
    return { defects };
  }
  return {
    defects,
    pages: [...pages],
    topologyVersion: typeof record.topologyVersion === 'number' ? record.topologyVersion : undefined,
  };
}

function coverageDefects(pages: readonly string[], defects: string[]): void {
  if (!pages.includes('overview.md')) defects.push('WikiSpec must include overview.md');

  const sources = new Set<string>();
  const sourcePages = new Set<string>();
  const domains = new Set<string>();
  const domainPages = new Set<string>();
  for (const page of pages) {
    const source = wikiSpecSourceId(page);
    if (!source) continue;
    sources.add(source);
    if (wikiSpecPageType(page) === 'source') sourcePages.add(source);
    const domain = wikiSpecDomainId(page);
    if (domain) {
      const key = `${source}/${domain}`;
      domains.add(key);
      if (wikiSpecPageType(page) === 'domain') domainPages.add(key);
    }
  }
  if (!sources.size) defects.push('WikiSpec must include at least one source.md');
  const missingSources = [...sources].filter((source) => !sourcePages.has(source));
  if (missingSources.length) defects.push(`missing source.md for: ${listed(missingSources)}`);
  if (sources.size && !domains.size) defects.push('WikiSpec must include at least one domain.md');
  const missingDomains = [...domains].filter((domain) => !domainPages.has(domain));
  if (missingDomains.length) defects.push(`missing domain.md for: ${listed(missingDomains)}`);
}
