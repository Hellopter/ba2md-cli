import { spawn } from 'node:child_process';
import path from 'node:path';
import { ensureDir, pathExists, removePath } from './fs.js';
import { CliError } from '../errors.js';

export async function runGit(args: string[], cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(new CliError(`Failed to run git: ${error.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      const detail = stderr.trim() || stdout.trim() || `git exited with code ${code}`;
      reject(new CliError(`git ${args.join(' ')} failed: ${detail}`));
    });
  });
}

export async function cloneRepository(
  url: string,
  finalPath: string,
  options: { ref?: string; tempParent: string },
): Promise<void> {
  if (await pathExists(finalPath)) {
    throw new CliError(`Clone destination already exists: ${finalPath}`);
  }

  await ensureDir(options.tempParent);
  const tempPath = path.join(
    options.tempParent,
    `.clone-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );

  try {
    const cloneArgs = ['clone', '--single-branch'];
    if (options.ref) {
      cloneArgs.push('--branch', options.ref);
    }
    cloneArgs.push(url, tempPath);
    await runGit(cloneArgs);

    await ensureDir(path.dirname(finalPath));
    // Rename only after a successful clone.
    const { rename } = await import('node:fs/promises');
    await rename(tempPath, finalPath);
  } catch (error) {
    await removePath(tempPath);
    throw error;
  }
}

export async function initLocalGitRepo(dir: string, message = 'init'): Promise<void> {
  await ensureDir(dir);
  await runGit(['init'], dir);
  await runGit(['config', 'user.email', 'ba2md-test@example.com'], dir);
  await runGit(['config', 'user.name', 'ba2md-test'], dir);
  await runGit(['add', '.'], dir);
  // Allow empty commits only when needed; standard add/commit is fine for fixtures.
  try {
    await runGit(['commit', '-m', message], dir);
  } catch {
    // Repository may already have content committed.
  }
}
