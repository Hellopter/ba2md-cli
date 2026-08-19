import fsp from 'node:fs/promises';
import path from 'node:path';
import { isDirectory, pathExists } from '../utils/fs.js';
import { toPosix } from '../utils/paths.js';
import {
  inspectWikiInventory,
  looksLikeWikiSpecV2,
  wikiSpecDomainIds,
  wikiSpecSourceIds,
  wikiSpecPageType,
  type WikiSpec,
} from './spec.js';

const MAX_DEPTH = 8;
const COMMITTED_SPEC = 'wiki-spec.json';

export interface CommittedSpecDrift {
  extraOnDisk: string[];
  missingOnDisk: string[];
}

export interface WikiWalkResult {
  pages: string[];
  spec?: WikiSpec;
  defects: string[];
  sources: string[];
  domains: string[];
  committedSpecDrift?: CommittedSpecDrift;
  committedSpecError?: string;
}

export async function walkWikiPages(absoluteRoot: string): Promise<string[]> {
  const pages: string[] = [];
  await visit(absoluteRoot, '', 0, pages);
  pages.sort((a, b) => a.localeCompare(b));
  return pages;
}

async function visit(
  dir: string,
  relative: string,
  depth: number,
  pages: string[],
): Promise<void> {
  if (depth > MAX_DEPTH) return;
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    const isDir = entry.isDirectory() || (entry.isSymbolicLink() && (await isDirectory(full)));
    if (isDir) {
      await visit(full, rel, depth + 1, pages);
      continue;
    }
    if (!entry.isFile() && !entry.isSymbolicLink()) continue;
    if (!entry.name.endsWith('.md')) continue;
    const posix = toPosix(rel);
    if (wikiSpecPageType(posix)) pages.push(posix);
  }
}

export async function collectWikiWalk(absoluteRoot: string): Promise<WikiWalkResult> {
  const pages = await walkWikiPages(absoluteRoot);
  const inspected = inspectWikiInventory(pages);
  const result: WikiWalkResult = {
    pages,
    spec: inspected.spec,
    defects: [...inspected.defects],
    sources: inspected.spec ? wikiSpecSourceIds(inspected.spec) : [],
    domains: inspected.spec ? wikiSpecDomainIds(inspected.spec) : [],
  };

  const committedPath = path.join(absoluteRoot, COMMITTED_SPEC);
  if (await pathExists(committedPath)) {
    try {
      const raw = JSON.parse(await fsp.readFile(committedPath, 'utf8')) as unknown;
      const committed = inspectWikiInventory(raw);
      if (!committed.spec) {
        result.committedSpecError = committed.defects.join('; ') || 'wiki-spec.json is not a WikiSpec';
        result.defects.push(`wiki-spec.json: ${result.committedSpecError}`);
      } else {
        const disk = new Set(pages);
        const listed = new Set(committed.spec.pages);
        const extraOnDisk = pages.filter((page) => !listed.has(page));
        const missingOnDisk = committed.spec.pages.filter((page) => !disk.has(page));
        if (extraOnDisk.length || missingOnDisk.length) {
          result.committedSpecDrift = { extraOnDisk, missingOnDisk };
          if (extraOnDisk.length) {
            result.defects.push(`wiki-spec.json drift extra on disk: ${extraOnDisk.join(', ')}`);
          }
          if (missingOnDisk.length) {
            result.defects.push(`wiki-spec.json drift missing on disk: ${missingOnDisk.join(', ')}`);
          }
        }
      }
    } catch (error) {
      result.committedSpecError = (error as Error).message;
      result.defects.push(`wiki-spec.json is not valid JSON: ${result.committedSpecError}`);
    }
  }

  return result;
}

export function isWikiSpecV2Inventory(pages: readonly string[]): boolean {
  return looksLikeWikiSpecV2(pages);
}
