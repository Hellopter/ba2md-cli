import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

export async function ensureDir(dir: string): Promise<void> {
  await fsp.mkdir(dir, { recursive: true });
}

export async function pathExists(target: string): Promise<boolean> {
  try {
    await fsp.lstat(target);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

export async function isDirectory(target: string): Promise<boolean> {
  try {
    const stat = await fsp.stat(target);
    return stat.isDirectory();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

export async function isSymlink(target: string): Promise<boolean> {
  try {
    const stat = await fsp.lstat(target);
    return stat.isSymbolicLink();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

export async function writeFileAtomic(filePath: string, content: string | Buffer): Promise<void> {
  await ensureDir(path.dirname(filePath));
  const tempPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`,
  );
  try {
    await fsp.writeFile(tempPath, content);
    await fsp.rename(tempPath, filePath);
  } catch (error) {
    await fsp.rm(tempPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

export async function copyDirectory(src: string, dest: string): Promise<void> {
  await fsp.cp(src, dest, {
    recursive: true,
    force: true,
    errorOnExist: false,
    filter: (source) => path.basename(source) !== '.DS_Store',
  });
}

export async function removePath(target: string): Promise<void> {
  await fsp.rm(target, { recursive: true, force: true });
}

/**
 * Remove a managed workspace entry without deleting the target of a local symlink/junction.
 */
export async function removeManagedEntry(target: string): Promise<void> {
  if (!(await pathExists(target))) {
    return;
  }

  const stat = await fsp.lstat(target);
  if (stat.isSymbolicLink()) {
    await fsp.unlink(target);
    return;
  }

  // Windows directory junctions report as directories with a reparse point.
  if (process.platform === 'win32' && stat.isDirectory()) {
    try {
      await fsp.unlink(target);
      return;
    } catch {
      // Fall through to recursive removal for real managed clones.
    }
  }

  await fsp.rm(target, { recursive: true, force: true });
}

export async function createTempDir(prefix: string): Promise<string> {
  return fsp.mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function listDirectMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

export async function walkFiles(root: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(current: string): Promise<void> {
    const entries = await fsp.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.DS_Store') {
        continue;
      }
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        results.push(full);
      }
    }
  }

  await walk(root);
  return results.sort((a, b) => a.localeCompare(b));
}

export function readFileSyncSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}
