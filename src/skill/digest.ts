import { createHash } from 'node:crypto';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { walkFiles } from '../utils/fs.js';
import { toPosix } from '../utils/paths.js';

export async function computeDirectoryDigest(root: string): Promise<string> {
  const files = await walkFiles(root);
  const hash = createHash('sha256');

  for (const file of files) {
    const relative = toPosix(path.relative(root, file));
    hash.update(relative);
    hash.update('\0');
    const content = await fsp.readFile(file);
    hash.update(content);
    hash.update('\0');
  }

  return hash.digest('hex');
}
