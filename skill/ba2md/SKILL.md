---
name: ba2md
description: "Create an implementable, source-grounded Software Detailed Design from Markdown requirements. Consume the wiki (WikiSpec v2 inventory → requirement wiki-plan) to locate owning and collaborating sources, dispatch sub-agents to write research briefs, synthesize an evidence-verified SDD, run content review, then hand the draft to the BA. Use for $ba2md, BA-to-SDD conversion, existing-system detailed design, and multi-source wiki-plus-source investigation. Do not use to create or rewrite BA or requirement documents."
---

# Generate Source-Grounded Detailed Designs

Design the smallest coherent change to the existing system. Prefer existing seams; do not invent parallel APIs, classes, tables, modules, jobs, or events without proving existing seams are insufficient.

## Paths

Use `{SKILL_DIR}` for this skill directory and `{WORKSPACE}` for the project root.

| Type | Path | Purpose |
|------|------|---------|
| Requirement input | `{WORKSPACE}/requirements/*.md` | Read-only. Explicit files, title/keyword match, or flat directory queue |
| Workspace registry | `{WORKSPACE}/workspace.yaml` | Managed ids for sources, wiki, requirements |
| Inventory | `ba2md discover --json` | Managed entries + WikiSpec v2 page lists. Run before content search |
| Tripwires | `ba2md check --product product/<slug>` | wiki-plan legality, non-empty briefs after accepted units, content-review file on a draft |
| Wiki | `{WORKSPACE}/wiki/<id>/` | Discovery/positioning digest. SUMMARY only |
| Sources | `{WORKSPACE}/sources/<id>/` | FACT roots. Fall back to `{WORKSPACE}/souces/` only when `sources/` is absent |
| Wiki plan | `{WORKSPACE}/product/<slug>/wiki-plan.json` | Requirement-filtered WikiSpec. Required before source research |
| Wiki position | `{WORKSPACE}/product/<slug>/wiki-position.md` | Owning/collaborating sources, vocabulary, wiki GAPs |
| Research plan | `{WORKSPACE}/product/<slug>/research-plan.md` | Units, execution state, dirty sections |
| Briefs | `{WORKSPACE}/product/<slug>/briefs/<unit-id>.md` | Frozen Unit Contract + search log + FOUND candidates. Empty `briefs/` after Research is a protocol failure |
| Registry | `{WORKSPACE}/product/<slug>/evidence-registry.md` | Evidence, claims, issues, Decision Map |
| Reviews | `{WORKSPACE}/product/<slug>/reviews/content-review-*.md` | Required before BA Draft Review |
| Draft / final | `{WORKSPACE}/product/<slug>/<slug>.draft.md` then `<slug>.md` | Final only after explicit BA confirmation |
| Template | `{SKILL_DIR}/templates/` | Replaceable document structure |
| Brief / review / registry shapes | `{SKILL_DIR}/assets/` | Copy, then fill |

Never modify `requirements/`, `wiki/`, `sources/`, or `souces/`. Honor explicit user paths. Default slug: `<file-stem>-sdd` for file input, `YYYY-MM-DD-<short-name>-sdd` for conversation. Ask on collision.

**Output language.** Deliverable and process-artifact prose follow `workspace.yaml` `language:` (default `zh`). Never translate evidence anchors, IDs, code identifiers, API paths, field/table/schema names, configuration keys, or quoted source.

Load references only when entering the node:

- Wiki Consumption / Scope Lock: `references/wiki.md`
- Research Plan → Brief Acceptance: `references/research.md` and `assets/research-brief-template.md`
- Draft / Content Review / BA / Final: `references/draft.md`, the active `templates/sdd.md` (+ referenced section constraints only), `assets/content-review-report-template.md`

## Evidence Vocabulary

- **REQUIREMENT**: requirement Markdown. Objectives, scope, rules, acceptance — never current implementation.
- **SUMMARY**: wiki. Terminology, ownership, boundaries.
- **FACT**: spec, ADR, production source, config, schema, deploy/ops artifact with a precise raw anchor.
- **PROPOSAL / DECISION / ASSUMPTION / GAP / CONFLICT**: target design, chosen option, unverified assumption, missing info, disagreeing authorities.

For current behavior, production code/config/schema outranks wiki. For contractual target behavior, the governing spec outranks implementation. Record conflicts; never silently merge them.

Exclude Java tests from source analysis: `test.java`, `**/src/test/**`, `**/*Test.java`, `**/*Tests.java`, `**/*IT.java`.

## Execution Graph

```text
Requirement Intake
  → Wiki Consumption          # discover inventory → wiki-plan → read → wiki-position
  → Scope Lock                # BA only if ambiguous / cross-source fork
  → Research Plan
  → Research (batched)        # subagents write briefs/<unit>.md; return summaries
  → Brief Acceptance          # reopen briefs + raw anchors
       ↺ more research?
  → Re-read IR + briefs
  → Draft Writing
  → Content Review            # subagent findings file
       ↺ repair / rewrite
  → BA Draft Review
  → Final                     # only on explicit 定稿
```

Do not collapse this into a one-pass pipeline. Required back edges: fact gap → Repair Research; content-review fail → repair or rewrite; BA comment → earliest affected node (see `references/draft.md`). A bounded GAP is a valid Draft result. Critical GAPs block Final, not transparent Draft writing.

## Node Workflow

### 1. Intake the Requirement

The user does not need to paste requirement text. Support explicit files, title/keyword matches, and a directory queue of `requirements/*.md` (no recursion). Index frontmatter/H1/H2 first; fully read only the selected unit. Treat `README.md` / `index.md` as navigation unless the body is a real requirement.

Record paths, SHA-256, selection rationale, and line anchors in `research-plan.md` and `evidence-registry.md` as `R-<REQ>-NNN`. Derive goals, actors, behavior, constraints, acceptance, and non-goals from `VERIFIED REQUIREMENT` records. Queue units independently — never mix evidence IDs across units.

Read the active `templates/sdd.md`. Use only sections it references. The template is structure, not evidence, and must not mechanically create research units.

### 2. Consume the Wiki and Lock Scope

Read `references/wiki.md`. **Mandatory first action:** `ba2md discover --json` (fallback: `workspace.yaml` + one-level listing). Do not grep `sources/**` or `wiki/**` to decide what exists.

Build `wiki-plan.json` (WikiSpec subset for this IR) and `wiki-position.md` (owning sources, collaborating sources or “none”, vocabulary, wiki GAPs). Read every `source.md` in the inventory. No wiki-plan → do not dispatch source research.

Starting sources come from wiki-position. Research may add sources when evidence surfaces them. Ask the BA at Scope Lock only when a wrong answer would send research to the wrong tree.

### 3. Plan and Run Research

Read `references/research.md`. Derive units from implementation concerns (`source × concern`), not template subsections. Before dispatch, write `briefs/<unit-id>.md` with a frozen Unit Contract. Subagents return `BRIEF_WRITTEN <path>` + counts. Chat is not evidence.

After each batch, reopen briefs and raw anchors, promote FOUND → VERIFIED, then decide whether more research is needed. Tiny single-source work still produces one brief, never zero.

### 4. Write the Draft

Read `references/draft.md`. Reopen the active template. Place evidence/claim IDs next to load-bearing statements. Stop a section and repair-research when a load-bearing fact is missing; otherwise record a GAP. Every `ADD` names inspected existing seams and why they are insufficient.

### 5. Content Review, then BA

Run `ba2md check --product product/<slug>` (subordinate tripwires). Then Content Review: findings file on disk, default one adversarial reviewer; high-risk up to three lenses. Loop repair/rewrite until `PASS` / `PASS_WITH_DISCUSSION` / `BLOCKED`. Mechanical PASS never authorizes BA handoff.

Present the review package and hand the floor. BA leads. Classify comments and iterate. Finalize `{slug}.md` only after explicit `定稿` / `LGTM` / `确认终稿`. Silence or “看起来还行” is not confirmation.

## Mandatory Rules

- Treat `requirements/` as read-only. Index first; keep queued units independent.
- Write prose in the workspace language; keep identifiers verbatim.
- Start from `ba2md discover --json`; forbid workspace-wide `sources/**` or `wiki/*` enumeration.
- Do not start source research without `wiki-plan.json` and `wiki-position.md`.
- Read every inventory `source.md` before locking starting sources.
- Wiki is SUMMARY; only `VERIFIED` FACT describes precise current identifiers or behavior.
- Briefs and content-review findings are inputs, not final evidence.
- Record unsupported content as GAP; never fabricate or ask the BA to guess facts.
- Prefer existing seams; every `ADD` needs existing-seam insufficiency evidence.
- Verify both endpoints of material cross-source boundaries, or GAP them.
- Do not create research units from template subsections.
- `ba2md check` is subordinate; Content Review is the primary gate and must run on every readable draft.
- In BA Draft Review, present the critical backlog as a menu and hand the floor. One question per turn only when the BA engages a fork.
- Route every resolution through the Decision Map and the earliest affected node; re-present a delta after each revision cycle.
- Block Final on unresolved critical GAP/CONFLICT, unconfirmed engaged decisions, uncleared `DIRTY` sections, missing content-review handoff, check failure, or missing explicit confirmation.
- Do not commit or push unless the user explicitly requests it.
