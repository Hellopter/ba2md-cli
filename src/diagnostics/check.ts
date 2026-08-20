import fsp from 'node:fs/promises';
import path from 'node:path';
import { isDirectory, pathExists } from '../utils/fs.js';

const DONE_STATUS_RE = /^(done|accepted|complete|ready.?for.?acceptance|closed)$/i;

export interface CheckReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
  productDir: string;
}

export async function checkProduct(
  workspaceRoot: string,
  productDir: string,
): Promise<CheckReport> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const absoluteProduct = path.resolve(workspaceRoot, productDir);

  if (!(await isDirectory(absoluteProduct))) {
    return {
      ok: false,
      errors: [`product directory does not exist: ${productDir}`],
      warnings,
      productDir: absoluteProduct,
    };
  }

  const planText = await readOptional(path.join(absoluteProduct, 'research-plan.md'));
  await checkBriefs(absoluteProduct, planText, errors);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    productDir: absoluteProduct,
  };
}

export function formatCheck(report: CheckReport): string {
  const lines: string[] = [];
  lines.push(report.ok ? 'PASSED' : 'FAILED');
  lines.push(`Product: ${report.productDir}`);
  for (const error of report.errors) {
    lines.push(`ERROR: ${error}`);
  }
  for (const warning of report.warnings) {
    lines.push(`WARNING: ${warning}`);
  }
  return lines.join('\n');
}

async function checkBriefs(
  productDir: string,
  planText: string | undefined,
  errors: string[],
): Promise<void> {
  if (!planText || !hasAcceptedResearch(planText)) return;
  const briefDir = path.join(productDir, 'briefs');
  const briefs = (await pathExists(briefDir)) && (await isDirectory(briefDir))
    ? (await fsp.readdir(briefDir)).filter((name) => name.endsWith('.md'))
    : [];
  if (briefs.length === 0) {
    errors.push('Research units accepted but briefs/ is empty');
  }
}

function hasAcceptedResearch(planText: string): boolean {
  const accepted = planText.match(/Accepted research units:\s*(\d+)/i);
  if (accepted && Number(accepted[1]) > 0) return true;

  const unitsSection = planText.split(/## (?:Research Units|研究单元)/i)[1];
  if (!unitsSection) return false;
  const nextHeading = unitsSection.search(/\n## /);
  const body = nextHeading >= 0 ? unitsSection.slice(0, nextHeading) : unitsSection;
  for (const line of body.split('\n')) {
    if (!line.startsWith('|') || /^\|\s*-+/.test(line) || /^\|\s*Unit ID/i.test(line)) continue;
    const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
    const status = cells[cells.length - 1] ?? '';
    if (DONE_STATUS_RE.test(status)) return true;
  }
  return false;
}

async function readOptional(filePath: string): Promise<string | undefined> {
  try {
    return await fsp.readFile(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}
