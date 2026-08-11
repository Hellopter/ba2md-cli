---
name: ba2md
description: "Create an implementable, source-grounded Software Detailed Design / 软件详细设计说明书 from Markdown requirements under requirements/ or from explicit requirement files. Read the wiki (a discovery/positioning digest spanning the source corpus) to identify which managed sources a requirement touches, dispatch sub-agents to deep-research those sources, and synthesize an evidence-verified SDD. Use for $ba2md, BA-to-SDD conversion, existing-system detailed design, evidence-verified SDDs, and multi-source wiki-plus-source investigation. Do not use to create or rewrite BA or requirement documents themselves."
---

# Generate Source-Grounded Detailed Designs

Design the smallest coherent change to the existing system. Prefer existing seams; do not invent parallel APIs, classes, tables, modules, jobs, or events without proving that existing seams are insufficient.

## Paths and Artifacts

Use `{SKILL_DIR}` for this skill directory and `{WORKSPACE}` for the project root.

| Type | Path | Purpose |
|------|------|---------|
| Requirement input | `{WORKSPACE}/requirements/*.md` | Read-only by default; supports explicit files, matching, and a flat directory queue |
| Workspace registry | `{WORKSPACE}/workspace.yaml` | Authoritative managed ids for sources, wiki, and requirements |
| Inventory command | `ba2md discover --json` (fallback: `ba2md status --json`) | Machine-readable managed entries and logical projects; run before content search |
| Summary material | `{WORKSPACE}/wiki/<id>/` (logical projects may be nested one level) | Discovery/positioning digest spanning the source corpus: identities, ownership, boundaries, terminology. Read it to decide which sources a requirement touches |
| Fact material | `{WORKSPACE}/sources/<id>/` | Managed source codebases (the corpus). Each selected source is a deep-research target and FACT root; fall back to `{WORKSPACE}/souces/` only when `sources/` is absent |
| Process artifact | `{WORKSPACE}/product/<slug>/research-plan.md` | Requirement state, selected sources, research units, dirty sections, and gate state |
| Process artifact | `{WORKSPACE}/product/<slug>/briefs/<unit-id>.md` | Initial or repair research brief when a brief is needed |
| Process artifact | `{WORKSPACE}/product/<slug>/evidence-registry.md` | Evidence, claims, issues, decisions, and user-confirmed changes |
| Process artifact | `{WORKSPACE}/product/<slug>/gate-report.md` | Latest quality-gate results and routing decisions |
| Deliverable | `{WORKSPACE}/product/<slug>/<slug>.draft.md` | Draft and final candidate |
| Deliverable | `{WORKSPACE}/product/<slug>/<slug>.md` | Final document after explicit user confirmation |
| Template package | `{SKILL_DIR}/templates/` | Replaceable document template and referenced section constraints |

For file input, default to `<file-stem>-sdd`; on basename collision, ask the user or disambiguate with an explicit slug. For conversational input, use `YYYY-MM-DD-<short-name>-sdd`. Honor explicit user paths. Never modify `requirements/`, `wiki/`, `sources/`, or `souces/`.

Load resources only when entering the corresponding node:

- Requirement discovery, selection, and resume: `references/requirement-intake.md`
- Source discovery and selection: `references/project-discovery.md`
- Nodes, transitions, repair research, and user-led Draft Review: `references/execution-graph.md`
- Research plan, subagents, briefs, and acceptance: `references/research-protocol.md`
- Evidence IDs, verification, quality gates, and final admission: `references/evidence-quality.md`
- Writing inputs, stop conditions, and section depth: `references/design-writing.md`
- Active template: `templates/sdd.md` and only the section constraints referenced by that active template
- Process artifact templates: `assets/*.md`
- Grilling (opt-in only, after Draft Review handoff): `grilling/SKILL.md` — loads `references/load-bearing.md`

## Evidence Vocabulary

- **REQUIREMENT**: a statement from requirement Markdown. It may support objectives, scope, business rules, and acceptance criteria, but never current implementation.
- **SUMMARY**: wiki material used only for terminology, ownership, and scope positioning.
- **FACT**: a specification, standard, ADR/design doc, production source, configuration, schema/migration, deployment artifact, or operations artifact with a precise raw anchor.
- **PROPOSAL**: target design introduced for this requirement.
- **DECISION**: selected design choice based on facts and alternatives.
- **ASSUMPTION**: unverified assumption with impact and owner recorded.
- **GAP**: required information still missing after bounded research.
- **CONFLICT**: disagreement among authoritative sources.

For current behavior, production code/config/schema/deployment artifacts outrank wiki. For contractual target behavior, the governing spec/standard outranks implementation. Record conflicts; never silently merge them.

Exclude Java tests from source analysis: exact `test.java`, `**/src/test/**`, `**/*Test.java`, `**/*Tests.java`, and `**/*IT.java`.

## Execution Graph

Read `references/execution-graph.md`. Follow this graph; do not collapse it into a one-pass pipeline:

```text
Requirement Intake → Project Discovery → Research Plan → Research
→ Brief Acceptance → Evidence Reconcile → Draft Writing
→ Quality Gate → Draft Review → Final
```

Required back edges:

- Draft Writing fact gap → Repair Research → Brief Acceptance → Evidence Reconcile → affected Draft Writing sections.
- Quality Gate evidence failure → Repair Research.
- Quality Gate writing failure → Draft Writing.
- Quality Gate conflict failure → Evidence Reconcile.
- Quality Gate scope/selection failure → Project Discovery.
- User decision, concern, or grill resolution → earliest affected node → rewrite draft → Quality Gate → Draft Review again.

A bounded GAP is a valid Draft result. Critical GAPs block Final, not transparent Draft writing. Draft Review is a **revision loop**, not a one-shot questionnaire before Final.

## Node Workflow

### 1. Intake the Requirement and Load the Active Template

Read `references/requirement-intake.md` first. The user does not need to paste requirement text. Support explicit files, title/keyword matches, and directory queue mode under `{WORKSPACE}/requirements/`. Build a lightweight index before fully reading the selected requirement unit. Give each queued requirement unit independent artifacts and resume state.

Record requirement paths, SHA-256 values, selection rationale, and exact line anchors in `research-plan.md` and `evidence-registry.md`. Derive goals, actors, behavior, constraints, acceptance signals, and non-goals from `VERIFIED REQUIREMENT` records.

Read the active `templates/sdd.md` directly. Treat the entire `templates/` directory as replaceable. Use only sections referenced by the active template; ignore bundled stale section files that are not referenced. The template defines output structure, but it does not prove evidence exists and it must not mechanically create research units.

### 2. Discover and Select Sources

Read `references/project-discovery.md`. **Mandatory first action:** run `ba2md discover --json` when the CLI is available; otherwise read `workspace.yaml` and list one level of `sources/` and `wiki/`. Build the managed-entry inventory and expand nested wiki logical projects **before** any `grep`/`Glob`/content search.

Never enumerate projects by searching `sources/**` or `wiki/**`, and never conclude “no wiki” from an empty `wiki/*.md` match when `wiki/<id>/` directories exist. Source roots must be concrete paths such as `sources/<id>` or `wiki/<id>/<project>`, never bare `wiki/` or `sources/`.

Wiki and sources are independent collections. The wiki is a discovery/positioning digest that spans the source corpus; `sources/` is the corpus of codebases. Read the wiki to build a map of the corpus (identities, ownership, boundaries, terminology), then **select the source project(s) the requirement touches** — not a one-to-one wiki↔source pair. A source may be selected with no wiki coverage (record a discovery GAP); one wiki entry may inform several sources.

**Source ID = the uppercased managed source id; one selected source is one research scope unit.** Record every managed source id in the Candidate Source Impact Map as `select` or `exclude` with a reason, and reference every managed wiki entry via a `wiki/<id>` path. Select the smallest covering set. Expand discovery when ownership, upstream/downstream boundaries, data ownership, events, authorization, jobs, or operations dependencies remain unresolved. Ask the user only when requirement meaning or materially different source-selection choices genuinely block progress.

**Workflow at a glance:** read the requirement → read the wiki → select relevant sources → write the research plan → dispatch sub-agents to deep-research each source → verify and reconcile their `FOUND` candidates → synthesize the SDD.

### 3. Plan Research

Read `references/research-protocol.md`. Create `research-plan.md` with requirement interpretation, selected sources, initial anchors, research units, execution state, dirty sections, and blocking issues.

Derive research units from implementation concerns, not from template sections. Use section constraints to decide what evidence the draft must contain. Never create one brief per template subsection mechanically. A tiny single-source task may use one consolidated brief.

Use a lightweight Draft Readiness Check for ordinary work. Use the heavier Full Closure Check only for high-risk changes: multi-service contract changes, database/schema migration, authorization/tenancy/security, money/accounting/audit, asynchronous events/jobs, release/rollback risk, or when the user requests complete impact analysis.

### 4. Research and Accept Evidence

Delegate bounded, independent fact-finding units to subagents when it materially helps and when each unit has clear inputs and outputs. Default small or single-project work to the main agent. Use one source per unit unless the unit is an explicitly named cross-source boundary. Subagents return `FOUND` candidates and never write the final SDD.

Each subagent research unit writes from `assets/research-brief-template.md`. The main agent must reopen load-bearing raw anchors before promoting candidates to `VERIFIED` in `evidence-registry.md`. Reject or repair briefs with unanchored identifiers, wiki-only implementation claims, mixed current/target behavior, unpropagated dependency discoveries, or unjustified `ADD` recommendations.

Build current-to-target decisions using `REUSE`, `MODIFY`, `EXTEND`, `ADD`, `DEPRECATE`, or `REMOVE`. Every `ADD` must name inspected existing seams and explain why they are insufficient.

### 5. Write the Draft

Read `references/design-writing.md`, reopen the active template, and read only the relevant section constraints referenced by the active template. Preserve the active template structure. Place evidence or claim IDs next to load-bearing statements. Represent required inventory items in the draft or record explicit exclusions.

When writing exposes a missing load-bearing fact about an API, field, symbol, schema, permission, limit, alert, transaction, integration, migration, rollout, or rollback:

1. stop the affected section and mark it `DIRTY`;
2. create one repair research unit for the missing-fact cluster;
3. research and accept evidence, or record a bounded GAP;
4. update the registry and decisions;
5. rewrite affected dependent sections.

Create another repair unit only when a new concrete path, symbol, source type, owner, source project, boundary, or user-provided source creates a new search hypothesis. Otherwise record a GAP instead of repeating speculative searches.

### 6. Run Quality Gates

Run deterministic validation as a mechanical check. If `{SKILL_DIR}/scripts/validate_artifacts.py` exists, execute:

```bash
python3 {SKILL_DIR}/scripts/validate_artifacts.py \
  --workspace {WORKSPACE} \
  --product-dir {WORKSPACE}/product/<slug> \
  --mode draft
```

Run semantic review after a readable draft and evidence registry exist. One comprehensive reviewer is enough by default; use at most two for high-risk or multi-project designs. Gate reviewers emit findings only; they cannot edit the draft, promote FACTs, choose business outcomes, or declare final PASS.

Rerun the appropriate gate after changes: mechanical validation for mechanical edits, local semantic review for wording or section-only edits, and full semantic gate for requirement scope, selected source(s), source evidence, API/schema/auth/data/event/rollback, critical GAP/CONFLICT, or final-candidate changes.

### 7. Hand the Floor in Draft Review, Then Revise Until Confirmed

After gating, enter Draft Review. Read `references/execution-graph.md` for the full protocol. This node has two jobs: collect what the user cares about, and turn resolutions into a new draft — not interrogate the user into accepting the first draft.

**Present the review package, then stop and wait.** Include:

- draft path and gate result;
- selected sources and recommended design direction;
- key evidence and key `REUSE/MODIFY/EXTEND/ADD` decisions;
- GAPs/CONFLICTs and whether they block Final;
- the **critical backlog**: agent-recorded load-bearing questions from drafting/gating, listed with short context only — not asked yet.

After that package, **hand the floor to the user** and end the turn. Do not open a structured question popup, do not start grilling, and do not walk the backlog until the user leads.

**User-led intake.** The user's concerns outrank the agent's backlog. Accept free-form reactions to the draft, requirement interpretation, scope, design direction, risk, evidence, or wording.

When the user engages an item, challenges a choice, or asks to be grilled, **Read and follow** `{SKILL_DIR}/grilling/SKILL.md` (nested sub-skill; loads `references/load-bearing.md`). Do not load grilling on the handoff turn. Grilling captures decisions only; it does not rewrite the draft or finalize.

After grilling returns — or after free-form feedback with no grill — write every resolution and free-form change to the Decision Map, mark affected sections `DIRTY`, and route to the earliest affected node. After research/reconcile/rewrite and the appropriate gate, return to Draft Review with a change summary and an updated critical backlog. Repeat this **revision loop** until the user explicitly accepts a candidate.

Create `{slug}.md`, set `status: final`, and run final validation only after the user explicitly confirms that final candidate. Silence, “看起来还行”, or clearing the agent's backlog alone is not confirmation.

## Mandatory Rules

- Treat `requirements/` as read-only by default. Index first, read full files on demand, and keep each queued requirement unit independent.
- Start Project Discovery from `ba2md discover --json` / `workspace.yaml`; forbid using workspace-wide `sources/**` or `wiki/*` searches to decide project count or wiki presence.
- Treat the active `templates/` directory as the sole document-structure authority; do not research, generate, or validate absent sections.
- Use wiki for discovery and summary only; it cannot independently prove precise implementation.
- Select sources per requirement from wiki discovery; never force one-to-one wiki↔source pairing — a source may have no wiki coverage.
- Use only `VERIFIED` FACTs to describe precise current identifiers or behavior.
- Treat research briefs and gate-subagent output as inputs, not final evidence.
- Record unsupported content as GAP; never fabricate or ask the user to guess facts.
- Prefer existing seams; every `ADD` needs existing-seam insufficiency evidence.
- Verify both endpoints of material cross-source boundaries when they are known or suspected; record bounded GAPs when evidence cannot be found.
- Do not create research units mechanically from template subsections.
- In Draft Review, present the critical backlog and hand the floor; load `grilling/SKILL.md` only on user lead or explicit opt-in.
- Prefer the user's concerns over the agent's question order; never ask the user to guess implementation facts.
- Route every resolution through the Decision Map and the earliest affected node; re-enter Draft Review after each revision cycle.
- Block finalization on unresolved critical GAPs/CONFLICTs, unconfirmed critical decisions the user engaged, uncleared `DIRTY` sections, gate failure, or missing explicit user confirmation of the final candidate.
- Do not commit or push unless the user explicitly requests it.
