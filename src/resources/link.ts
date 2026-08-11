import fsp from 'node:fs/promises';
import path from 'node:path';
import { CliError } from '../errors.js';
import { ensureDir, pathExists } from '../utils/fs.js';

/**
 * Create a workspace-local directory link.
 * Uses symlinks on POSIX and junction points on Windows.
 */
export async function linkLocalDirectory(sourceDir: string, destPath: string): Promise<void> {
  if (!(await pathExists(sourceDir))) {
    throw new CliError(`Local directory does not exist: ${sourceDir}`);
  }

  const stat = await fsp.stat(sourceDir);
  if (!stat.isDirectory()) {
    throw new CliError(`Local path is not a directory: ${sourceDir}`);
  }

  if (await pathExists(destPath)) {
    throw new CliError(`Destination already exists: ${destPath}`);
  }

  await ensureDir(path.dirname(destPath));

  if (process.platform === 'win32') {
    try {
      await fsp.symlink(sourceDir, destPath, 'junction');
      return;
    } catch {
      // Fall back to directory symlink if junctions are unavailable.
      await fsp.symlink(sourceDir, destPath, 'dir');
      return;
    }
  }

  // Absolute targets stay valid if the workspace directory is moved independently
  // of intermediate relative paths.
  await fsp.symlink(sourceDir, destPath, 'dir');
}
