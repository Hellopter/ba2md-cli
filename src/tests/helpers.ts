import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runGit } from '../utils/git.js';

export async function makeTempDir(prefix = 'ba2md-test-'): Promise<string> {
  return fsp.mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, content, 'utf8');
}

export async function makeGitRepo(dir: string, files: Record<string, string>): Promise<string> {
  await fsp.mkdir(dir, { recursive: true });
  for (const [relative, content] of Object.entries(files)) {
    await writeFile(path.join(dir, relative), content);
  }
  await runGit(['init'], dir);
  await runGit(['config', 'user.email', 'ba2md-test@example.com'], dir);
  await runGit(['config', 'user.name', 'ba2md-test'], dir);
  await runGit(['add', '.'], dir);
  await runGit(['commit', '-m', 'init'], dir);
  return dir;
}

export function fileUrl(absolutePath: string): string {
  const normalized = absolutePath.replace(/\\/g, '/');
  if (normalized.startsWith('/')) {
    return `file://${normalized}`;
  }
  return `file:///${normalized}`;
}
