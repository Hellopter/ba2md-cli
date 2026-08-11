#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'node:module';
import { isCliError } from './errors.js';
import { runDoctor, formatDoctor } from './diagnostics/doctor.js';
import { collectStatus, formatStatus } from './diagnostics/status.js';
import { addRequirement, listRequirements, removeRequirement } from './requirements/import.js';
import {
  addSource,
  addWiki,
  listResources,
  removeResource,
} from './resources/source.js';
import {
  installSkill,
  inspectSkillInstalls,
  repairSkill,
  skillHasProblems,
} from './skill/install.js';
import { requireWorkspace } from './workspace/discovery.js';
import { describeInit, initWorkspace } from './workspace/init.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('ba2md')
    .description('ba2md workspace CLI — manage sources, wiki, requirements, and the ba2md Skill')
    .version(pkg.version)
    .showHelpAfterError()
    .showSuggestionAfterError();

  program
    .command('init')
    .description('Create a ba2md workspace under <name>/')
    .argument('<name>', 'workspace directory name')
    .action(async (name: string) => {
      const result = await initWorkspace(name, process.cwd());
      console.log(describeInit(result));
    });

  const source = program.command('source').description('Manage source repositories');
  source
    .command('add')
    .description('Add a local directory link or Git clone under sources/')
    .argument('<locator>', 'local directory or Git URL')
    .option('--id <id>', 'explicit resource id')
    .option('--ref <ref>', 'Git ref/branch for clones')
    .action(async (locator: string, options: { id?: string; ref?: string }) => {
      const { root } = await requireWorkspace();
      const result = await addSource(root, locator, {
        id: options.id,
        ref: options.ref,
        cwd: process.cwd(),
      });
      console.log(`Added source "${result.id}" (${result.entry.type}) at ${result.entry.path}`);
    });
  source
    .command('list')
    .description('List configured sources')
    .action(async () => {
      const { config } = await requireWorkspace();
      const items = await listResources(config, 'sources');
      if (items.length === 0) {
        console.log('No sources configured');
        return;
      }
      for (const item of items) {
        console.log(`${item.id}\t${item.entry.type}\t${item.entry.path}\t${item.entry.locator}`);
      }
    });
  source
    .command('remove')
    .description('Remove a managed source link or clone (never deletes external local targets)')
    .argument('<id>', 'source id')
    .action(async (id: string) => {
      const { root } = await requireWorkspace();
      const entry = await removeResource(root, 'sources', id);
      console.log(`Removed source "${id}" (${entry.type})`);
    });

  const wiki = program.command('wiki').description('Manage wiki repositories');
  wiki
    .command('add')
    .description('Add a local directory link or Git clone under wiki/')
    .argument('<locator>', 'local directory or Git URL')
    .option('--id <id>', 'explicit resource id')
    .option('--ref <ref>', 'Git ref/branch for clones')
    .action(async (locator: string, options: { id?: string; ref?: string }) => {
      const { root } = await requireWorkspace();
      const result = await addWiki(root, locator, {
        id: options.id,
        ref: options.ref,
        cwd: process.cwd(),
      });
      console.log(`Added wiki "${result.id}" (${result.entry.type}) at ${result.entry.path}`);
    });
  wiki
    .command('list')
    .description('List configured wiki entries')
    .action(async () => {
      const { config } = await requireWorkspace();
      const items = await listResources(config, 'wiki');
      if (items.length === 0) {
        console.log('No wiki entries configured');
        return;
      }
      for (const item of items) {
        console.log(`${item.id}\t${item.entry.type}\t${item.entry.path}\t${item.entry.locator}`);
      }
    });
  wiki
    .command('remove')
    .description('Remove a managed wiki link or clone (never deletes external local targets)')
    .argument('<id>', 'wiki id')
    .action(async (id: string) => {
      const { root } = await requireWorkspace();
      const entry = await removeResource(root, 'wiki', id);
      console.log(`Removed wiki "${id}" (${entry.type})`);
    });

  const requirement = program.command('requirement').description('Manage flat Markdown requirements');
  requirement
    .command('add')
    .description('Import Markdown requirements as flat requirements/*.md snapshots')
    .argument('<locator>', 'local .md file, directory of .md files, or Git URL')
    .action(async (locator: string) => {
      const { root } = await requireWorkspace();
      const result = await addRequirement(root, locator, { cwd: process.cwd() });
      console.log(`Imported ${result.files.length} requirement file(s):`);
      for (const file of result.files) {
        console.log(`  - requirements/${file}`);
      }
    });
  requirement
    .command('list')
    .description('List configured requirement files')
    .action(async () => {
      const { config } = await requireWorkspace();
      const items = listRequirements(config);
      if (items.length === 0) {
        console.log('No requirements configured');
        return;
      }
      for (const item of items) {
        console.log(`${item.id}\t${item.entry.path}\t${item.entry.source}`);
      }
    });
  requirement
    .command('remove')
    .description('Remove a requirement snapshot file and registry entry')
    .argument('<name>', 'requirement filename (e.g. foo.md)')
    .action(async (name: string) => {
      const { root } = await requireWorkspace();
      await removeRequirement(root, name);
      console.log(`Removed requirement "${name}"`);
    });

  program
    .command('status')
    .description('Summarize workspace resources and Skill installation')
    .action(async () => {
      const { root, config } = await requireWorkspace();
      const report = await collectStatus(root, config);
      console.log(formatStatus(report));
    });

  program
    .command('doctor')
    .description('Check workspace health; exits nonzero on problems')
    .action(async () => {
      const { root, config } = await requireWorkspace();
      const report = await runDoctor(root, config);
      console.log(formatDoctor(report));
      if (!report.ok) {
        process.exitCode = 1;
      }
    });

  const skill = program.command('skill').description('Manage the packaged ba2md Skill installs');
  skill
    .command('install')
    .description('Install/refresh the Skill into .agents and .claude')
    .action(async () => {
      const { root } = await requireWorkspace();
      const manifest = await installSkill(root);
      console.log(`Installed Skill (package digest ${manifest.skill.packageDigest.slice(0, 12)}…)`);
      for (const target of Object.keys(manifest.skill.installs)) {
        console.log(`  - ${target}`);
      }
    });
  skill
    .command('status')
    .description('Report Skill install digests and drift')
    .action(async () => {
      const { root } = await requireWorkspace();
      const inspection = await inspectSkillInstalls(root);
      console.log(`Package digest: ${inspection.packageDigest}`);
      for (const result of inspection.results) {
        if (result.status === 'ok') {
          console.log(`${result.target}: ok (${result.digest})`);
        } else if (result.status === 'drift') {
          console.log(`${result.target}: drift expected=${result.expected} actual=${result.actual}`);
        } else {
          console.log(`${result.target}: ${result.status}`);
        }
      }
      if (skillHasProblems(inspection.results)) {
        process.exitCode = 1;
      }
    });
  skill
    .command('repair')
    .description('Reinstall managed Skill copies from the packaged assets')
    .action(async () => {
      const { root } = await requireWorkspace();
      const manifest = await repairSkill(root);
      console.log(`Repaired Skill installs (package digest ${manifest.skill.packageDigest.slice(0, 12)}…)`);
    });

  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  if (isCliError(error)) {
    console.error(`Error: ${error.message}`);
    process.exit(error.exitCode);
  }
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
});
