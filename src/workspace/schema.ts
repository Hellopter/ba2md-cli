import { z } from 'zod';
import {
  expectedRequirementPath,
  expectedSourcePath,
  expectedWikiPath,
  isSafeRequirementKey,
  isSafeResourceId,
  normalizeWorkspaceRelativePath,
} from '../utils/workspace-path.js';

export const ResourceEntrySchema = z.object({
  type: z.enum(['local', 'git']),
  path: z.string().min(1),
  locator: z.string().min(1),
  ref: z.string().min(1).optional(),
  linkedAt: z.string().optional(),
});

export const RequirementEntrySchema = z.object({
  path: z.string().min(1),
  source: z.string().min(1),
  importedAt: z.string().optional(),
});

const WorkspaceConfigObjectSchema = z.object({
  version: z.literal(1),
  name: z.string().min(1),
  language: z.string().default('zh'),
  createdAt: z.string().optional(),
  sources: z.record(ResourceEntrySchema).default({}),
  wiki: z.record(ResourceEntrySchema).default({}),
  requirements: z.record(RequirementEntrySchema).default({}),
});

export const WorkspaceConfigSchema = WorkspaceConfigObjectSchema.superRefine((data, ctx) => {
  for (const [id, entry] of Object.entries(data.sources)) {
    if (!isSafeResourceId(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `invalid source id "${id}"`,
        path: ['sources', id],
      });
      continue;
    }
    try {
      const normalized = normalizeWorkspaceRelativePath(entry.path);
      const expected = expectedSourcePath(id);
      if (normalized !== expected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `source "${id}" path must be exactly "${expected}"`,
          path: ['sources', id, 'path'],
        });
      }
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: (error as Error).message,
        path: ['sources', id, 'path'],
      });
    }
  }

  for (const [id, entry] of Object.entries(data.wiki)) {
    if (!isSafeResourceId(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `invalid wiki id "${id}"`,
        path: ['wiki', id],
      });
      continue;
    }
    try {
      const normalized = normalizeWorkspaceRelativePath(entry.path);
      const expected = expectedWikiPath(id);
      if (normalized !== expected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `wiki "${id}" path must be exactly "${expected}"`,
          path: ['wiki', id, 'path'],
        });
      }
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: (error as Error).message,
        path: ['wiki', id, 'path'],
      });
    }
  }

  for (const [name, entry] of Object.entries(data.requirements)) {
    if (!isSafeRequirementKey(name)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `invalid requirement key "${name}" (expected flat *.md filename)`,
        path: ['requirements', name],
      });
      continue;
    }
    try {
      const normalized = normalizeWorkspaceRelativePath(entry.path);
      const expected = expectedRequirementPath(name);
      if (normalized !== expected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `requirement "${name}" path must be exactly "${expected}"`,
          path: ['requirements', name, 'path'],
        });
      }
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: (error as Error).message,
        path: ['requirements', name, 'path'],
      });
    }
  }
});

export type ResourceEntry = z.infer<typeof ResourceEntrySchema>;
export type RequirementEntry = z.infer<typeof RequirementEntrySchema>;
export type WorkspaceConfig = z.infer<typeof WorkspaceConfigObjectSchema>;

export function emptyWorkspaceConfig(name: string): WorkspaceConfig {
  return WorkspaceConfigSchema.parse({
    version: 1,
    name,
    language: 'zh',
    createdAt: new Date().toISOString(),
    sources: {},
    wiki: {},
    requirements: {},
  });
}
