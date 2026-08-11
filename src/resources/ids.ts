import path from 'node:path';
import { CliError } from '../errors.js';
import { sanitizeId } from '../utils/paths.js';
import type { ClassifiedLocator } from './classify.js';

export function inferResourceId(locator: ClassifiedLocator, explicitId?: string): string {
  if (explicitId?.trim()) {
    const id = sanitizeId(explicitId.trim());
    validateId(id);
    return id;
  }

  if (locator.kind === 'local') {
    return validateId(sanitizeId(path.basename(locator.resolved)));
  }

  return validateId(sanitizeId(inferIdFromGitUrl(locator.resolved)));
}

export function inferIdFromGitUrl(url: string): string {
  let value = url.trim();

  if (value.startsWith('file://')) {
    try {
      value = decodeURIComponent(new URL(value).pathname);
    } catch {
      value = value.replace(/^file:\/\//, '');
    }
    return path.basename(value);
  }

  // git@host:path/repo.git
  const scp = value.match(/^git@[^:]+:(.+)$/);
  if (scp) {
    return path.basename(scp[1]);
  }

  try {
    if (/^https?:\/\//i.test(value) || /^ssh:\/\//i.test(value) || /^git:\/\//i.test(value)) {
      const parsed = new URL(value);
      const segments = parsed.pathname.split('/').filter(Boolean);
      return segments[segments.length - 1] ?? parsed.hostname;
    }
  } catch {
    // fall through
  }

  return path.basename(value);
}

function validateId(id: string): string {
  if (!/^[a-zA-Z0-9._-]+$/.test(id)) {
    throw new CliError(`Invalid resource id "${id}". Use letters, numbers, dot, underscore, or hyphen.`);
  }
  return id;
}
