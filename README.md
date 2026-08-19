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
| `ba2md discover` | Inventory managed sources/wiki and expand logical projects |
| `ba2md discover --json` | Machine-readable inventory of mounted ids (not wiki page types) |
| `ba2md check --product <dir>` | Tripwires for non-empty `briefs/` and content-review files |
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
IR intake → wiki inventory (discover) → wiki-plan + wiki-position
  → research briefs (batched sub-agents) → draft → content review → BA
```

- `ba2md discover --json` lists mounted `sources/<id>` and `wiki/<id>` (and nested docs layouts). It does not parse wiki page types — that layout lives in the Skill (`references/wiki.md`).
- The Skill reads `overview.md`, every `<source>/source.md`, then requirement-relevant domains/concepts, and writes `product/<slug>/wiki-plan.json` + `wiki-position.md` **before** source research.
- Research units land in `product/<slug>/briefs/`. Content review lands in `product/<slug>/reviews/`. `ba2md check --product product/<slug>` enforces those tripwires; it does not replace content review.
- BA is asked at scope lock only when the wiki match is ambiguous; after content review the BA leads draft iteration. Finalize only on explicit confirmation.

Agents must not enumerate projects with workspace-wide `sources/**` or `wiki/*.md` searches. Wiki is positioning (`SUMMARY`); precise current identifiers need `FACT` anchors under `sources/<id>/`.

## Development

```bash
npm install
npm run build
npm test
node dist/cli.js --help
```

## License

MIT
