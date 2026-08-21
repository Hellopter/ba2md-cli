import { createHash } from 'node:crypto';
import fsp from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { z } from 'zod';
import { isDirectory, pathExists } from '../utils/fs.js';

export const PROGRESS_FILE = 'progress.yaml';

export const PROGRESS_NODES = [
  'analyze',
  'wiki',
  'confirm',
  'research',
  'draft',
  'review',
  'wait',
  'final',
] as const;

export type ProgressNode = (typeof PROGRESS_NODES)[number];

const ProgressSchema = z.object({
  version: z.literal(1),
  slug: z.string().min(1),
  node: z.enum(PROGRESS_NODES),
  waiting_for: z.enum(['none', 'user', 'research', 'review']),
  intake: z
    .object({
      requirement_path: z.string().default(''),
      requirement_sha256: z.string().default(''),
      named_sources: z.boolean().default(false),
    })
    .default({
      requirement_path: '',
      requirement_sha256: '',
      named_sources: false,
    }),
  confirmed_sources: z
    .array(
      z.object({
        id: z.string().min(1),
        role: z.enum(['owner', 'collaborator', 'maybe']),
        brief: z.string().default(''),
        status: z.enum(['open', 'accepted', 'excluded']),
      }),
    )
    .default([]),
  research: z
    .object({
      open: z.array(z.string()).default([]),
      accepted: z.number().int().min(0).default(0),
    })
    .default({ open: [], accepted: 0 }),
  draft: z
    .object({
      path: z.string().default(''),
      sha256: z.string().default(''),
    })
    .default({ path: '', sha256: '' }),
  review: z
    .object({
      round: z.number().int().min(0).default(0),
      last_result: z.enum(['none', 'WRITE', 'DELIVER']).default('none'),
      draft_sha256: z.string().default(''),
      files: z.record(z.string().min(1)).default({}),
    })
    .default({
      round: 0,
      last_result: 'none',
      draft_sha256: '',
      files: {},
    }),
  final: z.boolean().default(false),
});

export type Progress = z.infer<typeof ProgressSchema>;

export type ParseProgressResult =
  | { ok: true; progress: Progress }
  | { ok: false; errors: string[] };

const DRAFT_NODES = new Set<ProgressNode>(['draft', 'review', 'wait', 'final']);
const HANDOFF_NODES = new Set<ProgressNode>(['wait', 'final']);

export function sha256Text(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export async function sha256File(absolutePath: string): Promise<string | undefined> {
  try {
    const content = await fsp.readFile(absolutePath);
    return createHash('sha256').update(content).digest('hex');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

export function parseProgressYaml(raw: string): ParseProgressResult {
  let parsed: unknown;
  try {
    parsed = YAML.parse(raw);
  } catch (error) {
    return { ok: false, errors: [`invalid YAML in ${PROGRESS_FILE}: ${(error as Error).message}`] };
  }

  const result = ProgressSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const where = issue.path.join('.') || '(root)';
      return `invalid ${PROGRESS_FILE}: ${where}: ${issue.message}`;
    });
    return { ok: false, errors };
  }
  return { ok: true, progress: result.data };
}

export function hashesStatus(
  progress: Progress,
  fileHash: string | undefined,
): 'match' | 'mismatch' | 'none' {
  const draftHash = progress.draft.sha256;
  const reviewedHash = progress.review.draft_sha256;
  if (!reviewedHash) return 'none';
  if (!fileHash || !draftHash) return 'mismatch';
  if (fileHash === draftHash && fileHash === reviewedHash) return 'match';
  return 'mismatch';
}

export function formatProgressCursor(
  progress: Progress,
  hashes: 'match' | 'mismatch' | 'none',
): string {
  return `Node: ${progress.node} round=${progress.review.round} last_result=${progress.review.last_result} hashes=${hashes}`;
}

export async function collectProgressErrors(
  productDir: string,
  progress: Progress,
): Promise<string[]> {
  const errors: string[] = [];
  const acceptedSource = progress.confirmed_sources.some((source) => source.status === 'accepted');
  if (progress.research.accepted > 0 || acceptedSource) {
    const briefs = await listBriefs(productDir);
    if (briefs.length === 0) {
      errors.push('Research units accepted but briefs/ is empty');
    }
  }

  if (DRAFT_NODES.has(progress.node)) {
    if (!progress.draft.path) {
      errors.push('progress.yaml draft.path is empty');
    } else {
      const draftAbs = resolveInsideProduct(productDir, progress.draft.path, errors);
      if (draftAbs && !(await pathExists(draftAbs))) {
        errors.push(`draft file missing: ${progress.draft.path}`);
      }
    }
  }

  if (HANDOFF_NODES.has(progress.node)) {
    if (progress.review.last_result !== 'DELIVER') {
      errors.push(`node ${progress.node} requires review.last_result DELIVER`);
    }
    const files = progress.review.files;
    if (!files.structure || !files.evidence) {
      errors.push('wait/final requires review.files.structure and review.files.evidence');
    }
    for (const relative of Object.values(files)) {
      const abs = resolveInsideProduct(productDir, relative, errors);
      if (abs && !(await pathExists(abs))) {
        errors.push(`review file missing: ${relative}`);
      }
    }

    if (progress.draft.path) {
      const draftAbs = resolveInsideProduct(productDir, progress.draft.path, []);
      const fileHash = draftAbs ? await sha256File(draftAbs) : undefined;
      if (
        !fileHash ||
        !progress.draft.sha256 ||
        !progress.review.draft_sha256 ||
        fileHash !== progress.draft.sha256 ||
        fileHash !== progress.review.draft_sha256
      ) {
        errors.push('review is stale: draft sha256 does not match review.draft_sha256');
      }
    }
  }

  if (progress.final || progress.node === 'final') {
    const finalName = `${progress.slug}.md`;
    if (!(await pathExists(path.join(productDir, finalName)))) {
      errors.push(`final document missing: ${finalName}`);
    }
  }

  return errors;
}

export async function hasStartedProductWork(productDir: string): Promise<boolean> {
  if (await pathExists(path.join(productDir, 'research-plan.md'))) return true;
  const entries = await fsp.readdir(productDir);
  if (entries.some((name) => name.endsWith('.draft.md'))) return true;
  const briefs = await listBriefs(productDir);
  return briefs.length > 0;
}

async function listBriefs(productDir: string): Promise<string[]> {
  const briefDir = path.join(productDir, 'briefs');
  if (!(await pathExists(briefDir)) || !(await isDirectory(briefDir))) return [];
  return (await fsp.readdir(briefDir)).filter((name) => name.endsWith('.md'));
}

function resolveInsideProduct(
  productDir: string,
  relative: string,
  errors: string[],
): string | undefined {
  if (!relative || path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) {
    errors.push(`path escapes product directory: ${relative}`);
    return undefined;
  }
  return path.resolve(productDir, relative);
}
