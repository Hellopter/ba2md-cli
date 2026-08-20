# ba2md-cli

Workspace CLI for the **ba2md** Agent Skill. It creates a standard workspace, attaches source/wiki/requirement inputs, and installs the packaged Skill for Claude and OpenCode-compatible hosts. AI generation is performed by `claude` or `opencode` inside the workspace via the installed Skill — this CLI does not call an LLM.

## Requirements

- Node.js **>= 22**
- `git` on `PATH` (for Git locators)

## Install

```bash
npm install -g ba2md-cli
# or from this repo
npm install
npm run build
npm link
```

## Quickstart

```bash
ba2md init demo
cd demo

ba2md source add /Users/gaoaotian/Desktop/open-okf-wiki --id open-okf-wiki
ba2md wiki add /Users/gaoaotian/Desktop/referrance/docs --id docs
ba2md requirement add /Users/gaoaotian/Desktop/referrance/llm-wiki.md

ba2md status
ba2md status --json
ba2md discover
ba2md discover --json
ba2md doctor

# Then run Claude or OpenCode in this workspace and invoke the ba2md Skill.
# The Skill must run `ba2md discover --json` before content search.
```

## Workspace layout

`ba2md init <name>` creates `<cwd>/<name>/` with:

| Path | Purpose |
|------|---------|
| `workspace.yaml` | Versioned registry (`version: 1`) for sources, wiki, requirements |
| `sources/` | Linked local directories or managed Git clones |
| `wiki/` | Linked local directories or managed Git clones |
| `requirements/` | Flat Markdown snapshots only (`requirements/*.md`) |
| `product/` | Skill-generated design artifacts (created empty) |
| `.ba2md/` | Runtime metadata (`runtime.json` digests) |
| `.agents/skills/ba2md/` | Packaged Skill install (OpenCode-compatible) |
| `.claude/skills/ba2md/` | Packaged Skill install (Claude) |

No workspace Git repo is initialized. Root `AGENTS.md` / `CLAUDE.md` are not modified. `.opencode/` is not created.

## Commands

| Command | Description |
|---------|-------------|
| `ba2md init <name>` | Create workspace; re-run is non-destructive |
| `ba2md source add <local-dir-or-git-url> [--id] [--ref]` | Link local dir or clone Git repo under `sources/` |
| `ba2md source list` | List sources |
| `ba2md source remove <id>` | Remove managed link/clone (never deletes external local targets) |
| `ba2md wiki add <local-dir-or-git-url> [--id] [--ref]` | Same behavior under `wiki/` |
| `ba2md wiki list` | List wiki entries |
| `ba2md wiki remove <id>` | Remove managed wiki entry safely |
| `ba2md requirement add <file\|dir\|git-url>` | Import flat `requirements/*.md` snapshots |
| `ba2md requirement list` | List requirement files |
| `ba2md requirement remove <name.md>` | Delete snapshot + registry entry |
| `ba2md status` | Summarize resources and Skill installs |
| `ba2md status --json` | Same summary as machine-readable JSON |
| `ba2md discover` | Inventory managed sources/wiki, logical projects, and each wiki's structure tree |
| `ba2md discover --json` | Same inventory as JSON, including `tree` (paths only; not page types) |
| `ba2md check --product <dir>` | Optional: `progress.yaml` cursor vs product dir (briefs, draft, stale review) |
| `ba2md doctor` | Health checks; nonzero exit on problems |
| `ba2md skill install` | Install/refresh Skill into `.agents` and `.claude` |
| `ba2md skill status` | Show digests / drift |
| `ba2md skill repair` | Reinstall managed Skill copies |

Commands invoked below the workspace root walk upward to the nearest `workspace.yaml`.

## Local vs Git behavior

- **Local path that exists** always wins over Git URL inference.
- **Source/wiki local directories** are linked into the workspace (symlink; Windows junction when practical).
- **Source/wiki Git URLs** (`https://`, `ssh://`, `git@host:path`, `file://`, …) are cloned through a temporary path, then renamed into place. Optional `--ref` selects branch/tag.
- **Requirements** are always flat Markdown snapshots:
  - file → `requirements/<filename>.md`
  - directory → only direct child `*.md` files
  - Git → only repository-root `*.md` files (temp clone removed afterward)
  - collisions fail before any partial copy or config write
- Managed **remove** unlinks workspace entries only; it does not delete the target of a local source/wiki link.

## AI generation

Install Claude Code or OpenCode, open the initialized workspace, and use the **ba2md** Skill (`$ba2md`). Runtime:

```text
analyze IR → consume wiki (bridge IR to the project) → lock sources
  → research subagents write briefs/ → write draft (evidence in the draft)
  → structure + evidence review of the draft → deliver or rewrite → wait
```

- The packaged Skill (`skill/ba2md/`) is Chinese. `{SKILL_DIR}/templates/` (`sdd.md` + `sections/`) may be replaced wholesale by an internal pack — **same layout, different markdown bodies**.
- Resume across sessions from `product/<slug>/progress.yaml` (node, waiting_for, draft/review hashes). Copy `assets/progress-template.yaml`. Subagents do not write this file.
- `ba2md discover --json` lists mounted `sources/<id>` and `wiki/<id>`, plus each wiki's `tree` (organizational structure). It does not classify page types. Logical-project `marker` files are not a reading order.
- Wiki is the first bridge from the IR to the project. Reading rules live only in the Skill (`references/wiki.md`): read overview / architecture / source pages, skip `index.md`, then grep keywords and follow links. The Skill does not write `wiki-plan.json`, `wiki-position.md`, or `evidence-registry.md`.
- The Skill asks the user only when source location is still uncertain after reading the relevant wikis. A matching owner plus wiki-judged collaborators are copied into confirmed sources without a confirmation ritual. Pending neighbours are judged from their wiki first; related ones are researched.
- Research units land in `product/<slug>/briefs/`. One subagent per confirmed source root, not one per template section.
- Evidence (anchors, decisions, gaps) lives in `<slug>.draft.md`. Review subagents judge that draft (structure and evidence). Fail → rewrite (research again if facts are missing). Pass → deliver and wait.
- Review is durable only when `progress.yaml` has `last_result: DELIVER` and `review.draft_sha256` matches the current draft. Chat `REVIEW_WRITTEN` is session-local.
- `ba2md check --product` is optional: it verifies the cursor against disk (missing progress after work started, empty briefs, stale review hashes). It is not a design-quality gate. The Skill may run it on resume.

Agents must not enumerate projects with workspace-wide `sources/**` or `wiki/*.md` searches. Wiki is positioning (`SUMMARY`); precise current identifiers need anchors under `sources/<id>/` written in the draft.

## Development

```bash
npm install
npm run build
npm test
node dist/cli.js --help
```

## License

MIT
