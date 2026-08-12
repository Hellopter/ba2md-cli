# Research Planning, Briefs, and Subagents

Use research to find raw facts that make the SDD implementable. Research units organize investigation; they are not document sections. Briefs summarize investigation; they never replace raw evidence.

Every completed research unit produces an on-disk brief at `product/<slug>/briefs/<unit-id>.md` from `assets/research-brief-template.md`. Tiny single-source work may use one consolidated brief; zero briefs after Research is a protocol failure.

## Research Plan Contract

Write `{WORKSPACE}/product/<slug>/research-plan.md`:

```markdown
# Research Plan: <title>

## Requirement Input
| Requirement ID | Path | SHA-256 | Line anchor | Role |
|----------------|------|---------|-------------|------|

## Requirement Interpretation
- Goal:
- Actors:
- In scope:
- Out of scope:
- Constraints:
- Acceptance signals:

## Inventory Source
- Command or files used (`ba2md discover --json` / `ba2md status --json` / `workspace.yaml` + listing):
- Managed source ids:
- Managed wiki ids / logical wiki projects:

## Selected Sources (running note, derived from evidence)
| Source ID | Sources root | Wiki coverage | Role in requirement | Selection basis |
|-----------|--------------|---------------|---------------------|-----------------|
| | `sources/<id>` | `wiki/<id>` or `wiki/<id>/<project>` (optional) | | |

> Optional. This is a running note of what you believe is in scope, **derived from the evidence you have written** — not a prerequisite for writing evidence. Add rows as research surfaces more sources. The mechanical validator does not read this table and does not fail when sources are unmentioned.

## Requirement-to-Source Coverage
| Requirement ID | Owning source | Supporting sources | Status | Notes |
|----------------|---------------|--------------------|--------|-------|

## Cross-Source Boundary Coverage
| Boundary ID | Caller/producer source | Provider/consumer source | Boundary | Status | Evidence/GAP |
|-------------|------------------------|--------------------------|----------|--------|--------------|

## Initial Current-System Anchors
| Source ID | Concern | Candidate anchor | Confidence |
|-----------|---------|------------------|------------|

## Research Units
| Unit ID | Trigger | Source ID / Boundary | Concern | Questions | Expected facts | Brief path | Dependencies | Status |
|---------|---------|----------------------|---------|-----------|----------------|------------|--------------|--------|
| | | | | | | `briefs/<unit-id>.md` | | |

> Before a unit starts, write `briefs/<unit-id>.md` with the frozen `## Unit Contract` filled. Status may become done only after that brief exists on disk with Search Log and candidates or a bounded negative GAP.

## Execution State
- Current node:
- Resume node:
- Open research units:
- Accepted research units:
- Dirty sections:
- Blocking issues:
- Repair attempts by issue:
- Remaining search hypotheses:
- content_review_round:
- repair_rounds_by_finding_cluster:
- Ready for Draft Review handoff: Yes/No
- Last gate:
```

These tables prevent scope drift, but keep them lean. For ordinary single-source work, one or two rows with explicit GAPs is better than a large speculative map.

## Draft Readiness vs Full Closure

Use the lightweight **Draft Readiness Check** by default. Before broad draft writing, confirm:

- the selected requirement unit has path/hash/anchors;
- inventory was taken from `ba2md discover` / `status` / `workspace.yaml` before content search;
- at least one starting source is picked and its `sources/<id>` root is readable (selection is progressive — you do not need to pre-select or pre-exclude every managed source);
- the owning source(s) have concrete `sources/<id>` roots (not bare collection roots); wiki coverage is optional;
- selected source roots are readable;
- load-bearing current facts are either `VERIFIED` or recorded as GAP;
- known material boundaries have an owner/endpoints, an explicit exclusion, or GAP;
- key target changes are represented as PROPOSAL/DECISION candidates;
- the active template's relevant output needs are understood well enough to write transparent draft sections.

Use **Full Closure Check** only for high-risk changes: multi-service contract changes, external APIs, database/schema migration, authorization/tenancy/security, money/accounting/audit, asynchronous events/jobs, release/rollback risk, or explicit user request. Full Closure additionally checks complete known boundary coverage, data/event ownership, strong candidate exclusions, and inventory coverage for affected APIs/interfaces/entities/jobs/config/metrics/alerts.

A failed Draft Readiness item returns to Project Discovery or Research. A critical missing fact can be a GAP in Draft but blocks Final.

## Unit Design

Derive research units from implementation concerns, not from template subsections. Use section constraints to decide what evidence the draft must contain; never create one brief per template subsection mechanically.

Split by disjoint `source × concern`, such as:

- request-to-persistence main path;
- API/contract fields, results, and errors;
- data model, migrations, transactions, and consistency;
- integrations, events, jobs, files, and failure handling;
- authorization, tenant boundaries, rate limits, audit, and sensitive data;
- observability, alerts, deployment, rollback, and tests;
- governing specs, standards, ADRs, and design documents.

Use a cross-source unit only for an explicitly named integration boundary. State caller source, provider source, ownership, compatibility, and failure responsibility.

## When a Brief Is Mandatory

**Every completed research unit produces a brief file.** Main-agent and subagent units both write `product/<slug>/briefs/<unit-id>.md`. Tiny single-source work still produces **one** consolidated brief, not zero. Empty `briefs/` after Research is a protocol failure. The canonical `evidence-registry.md` is always required in addition to briefs.

## Research Unit I/O Contract

Every research unit — main-agent or subagent — is a pure file-backed job.

### Input (must be explicit in the brief before work starts)
- Unit Contract table (frozen)
- requirement excerpt text or precise R-* anchors
- concrete sources root
- bounded questions / expected fact types
- test exclusion rules
- path to this brief file

### Process
- Search only under the assigned root (+ cited wiki pages if listed)
- Write progress into THIS brief file only
- Do not edit research-plan.md, evidence-registry.md, draft, or other briefs

### Output (must exist on disk before unit status can become done)
- `product/<slug>/briefs/<unit-id>.md` with:
  - Unit Contract (unchanged)
  - Search Log (at least one row, including negative searches)
  - Evidence Candidates table (FOUND only for FACT) and/or Missing Material GAP rows
- No FACT may be marked VERIFIED in the brief

### Dispatch rule
Before spawning a subagent, the main agent MUST write the brief file with Unit Contract filled.
The subagent prompt MUST include the absolute brief path and say:
"Read and update only this file. Your final action is saving this brief. Return only: BRIEF_WRITTEN <path> + candidate counts."
Do not accept a subagent textual dump as a substitute for the brief file.

## Subagent Assignment

Delegate only when the unit is independent, bounded, and has clear inputs/outputs. Default small or single-project work to the main agent. Do not delegate the immediate blocker if the next local step depends on it.

Give each subagent the Research Unit I/O Contract above, plus:

- the relevant requirement excerpt and requirement ID;
- exactly one Source ID, or one named cross-source boundary;
- selected wiki SUMMARY entry pages (optional discovery context for the source);
- **concrete** sources root (`sources/<id>` or deeper path inside it) and known anchors — never the bare `sources/` collection;
- bounded questions and expected evidence types;
- only relevant template constraints, never every section file;
- the Java test exclusion: `test.java`, `src/test/`, `*Test.java`, `*Tests.java`, and `*IT.java`;
- absolute path to the pre-written brief file (`product/<slug>/briefs/<unit-id>.md` from `assets/research-brief-template.md`);
- instruction to obey repository-local `AGENTS.md` and use context-graph tools before grep when available;
- instruction to search only under the assigned source root and any cited wiki pages; do not run workspace-wide `sources/**` or `wiki/**` enumeration;
- instruction to report contrary, missing, and insufficient evidence;
- instruction not to edit the final design or the frozen Unit Contract section.

Do not leak expected answers. A recommendation must follow investigation of existing seams.

## Evidence Candidate Rules

Subagents assign candidate IDs and status `FOUND`. They must provide raw paths and line/symbol anchors, not brief paths, for FACT candidates. The main agent owns final IDs and resolves collisions while merging into the registry.

A subagent may report `SUMMARY`, `FACT`, `ASSUMPTION`, `GAP`, and `CONFLICT`; it must not mark a FACT `VERIFIED`.

## Brief Acceptance Gate (file-backed)

Inputs: list of brief paths from Execution State / Research Units table.

For each path:
1. Fail closed if file missing → unit status `FAILED_NO_BRIEF`, re-dispatch or main-agent fill.
2. Read Unit Contract; reject brief if Source ID/root drifted from contract.
3. Reopen every load-bearing raw anchor cited in Evidence Candidates.
4. Promote accepted FACT FOUND → VERIFIED in evidence-registry.md (main agent only).
5. Mark wrong candidates REJECTED with reason in registry (and note in brief Main-Agent Acceptance).
6. Propagate newly discovered sources/boundaries into research-plan / new units.
7. Only then mark unit Accepted.

Merge order for parallel units:
- accept non-overlapping sources first;
- then boundary units;
- resolve ID collisions in the main agent while writing the registry.
Do not summarize from memory across units — reopen each brief file.

Also reject or repair a brief when:

- an exact identifier lacks a raw anchor;
- wiki is the only support for a code-level claim;
- current and proposed behavior are mixed;
- a new interface/class/table/job/event is recommended without inspecting existing seams;
- permissions, limits, alerts, migration, rollback, or operations are ignored despite relevance;
- a boundary verifies only one endpoint;
- dependency discoveries are not propagated;
- searches are claimed but not recorded;
- a repeated-item search reports only examples when complete inventory is required for the chosen risk level.

## Repair Research and Convergence

Use the same brief template with `Trigger: Repair Research`. Include source node, failed gate or writing gap, affected claim IDs and dirty sections, prior searches, exact unknowns, bounded roots, and completion condition.

Default to one Repair Research unit per unique missing-fact cluster. Create another only when the previous unit reveals a new concrete path, symbol, artifact type, source type, owner, source project, boundary, or user-provided corpus. Never rerun the same searches through another subagent merely to seek a different answer.

Close a research unit successfully when either:

- usable raw FACT is found and verified by the main agent; or
- bounded search proves the corpus does not contain the required fact, and the absence is recorded as GAP with searched roots, queries, impact, and owner.

Do not turn factual GAPs into popup questions. The user is not responsible for guessing interfaces, fields, class names, thresholds, or configuration. A critical GAP may block Final, but it should remain visible in Draft and the gate report.

## Content Review (primary Quality Gate)

Content Review is the primary Quality Gate. Invoke it after a readable draft and evidence registry exist. Run mechanical precheck before or in parallel when useful; a mechanical failure suppresses Content Review only when the draft or registry cannot be read. Mechanical PASS never substitutes for Content Review and never authorizes Draft Review handoff.

Reviewers emit findings only. They must not edit the draft, promote FACTs, choose business outcomes, or declare final PASS / Final. The main agent rechecks load-bearing findings, merges multi-lens reports, routes outcomes, and alone sets `Ready for Draft Review handoff`.

Detailed checklists live in `references/evidence-quality.md`. Intensity, I/O, merge, and convergence rules live here.

### Content Review modes

#### Default (ordinary single-source / low-risk)

1. One comprehensive content reviewer (findings only).
2. Reviewer must actively try to break the draft:
   - unsupported precise identifiers
   - wiki/REQUIREMENT used as current implementation
   - ADD without seam insufficiency
   - missing failure/auth/rollback when relevant
   - brief claims not present in registry/draft traceably
3. Main agent adversarially spot-checks top findings (reopen anchors) before routing.

#### High-risk (Full Closure triggers already defined in skill)

Run up to 3 parallel reviewers with disjoint lenses:

1. `evidence-consistency` — registry ↔ draft ↔ briefs ↔ raw anchors
2. `e2e-completeness` — requirement coverage, boundaries, ops/security/migration
3. `adversarial-refuter` — assume draft is wrong; try to refute key REUSE/MODIFY/EXTEND/ADD decisions and exact paths

Merge rule:

- Union findings.
- Deduplicate by `(section, problem fingerprint)`.
- If `adversarial-refuter` refutes a load-bearing claim and others did not defend it with VERIFIED evidence → treat as EVIDENCE or REVISION required.
- Majority is not enough to pass: any Critical unrefuted-attack that stands after main-agent recheck blocks handoff.

### Content reviewer I/O

Every Content Review pass — main-agent or subagent — is a pure file-backed job (mirrors research units).

#### Input (must be explicit in the reviewer prompt + readable files)

- draft path
- evidence-registry path
- research-plan path
- list of brief paths
- active template path / relevant section constraints
- reviewer lens: `comprehensive` | `evidence-consistency` | `e2e-completeness` | `adversarial-refuter`
- output path: `product/<slug>/reviews/content-review-<round>-<lens>.md`
- absolute path to `assets/content-review-report-template.md`

#### Process

- Read only the assigned inputs; reopen raw anchors when attacking load-bearing claims
- Write findings into THIS review file only
- Do not edit draft, evidence-registry, research-plan, or briefs
- Do not promote FACTs, choose business outcomes, or declare final PASS / Final

#### Output (must exist on disk before handoff can be considered)

- `product/<slug>/reviews/content-review-<round>-<lens>.md` using `assets/content-review-report-template.md`
- return: `REVIEW_WRITTEN <path>` + finding counts (Critical/High/Medium/Low)

Chat-only review without a file is invalid for high-risk. For default, the main agent may write the report file itself from a single reviewer response, but the file must still exist before handoff.

Before spawning a content-review subagent, the main agent MUST include the absolute output path and say:
"Write only this review file from the content-review-report-template. Return only: REVIEW_WRITTEN <path> + finding counts."
Do not accept a subagent textual dump as a substitute for the review file when high-risk lenses run.

### Content Review ↔ Repair convergence

Track in `gate-report.md` / research-plan Execution State:

- `content_review_round`
- `repair_rounds_by_finding_cluster`

Defaults:

- max `content_review_round` = 3 before forced handoff-as-`BLOCKED` or `PASS_WITH_DISCUSSION` (main agent chooses by whether Critical must-fix items remain with no remaining search hypothesis)
- one repair unit per missing-fact cluster (existing Repair Research rule)
- another repair only on a new concrete search hypothesis

After each repair/rewrite: rerun mechanical precheck + appropriate content review level (full after evidence/scope changes; local after wording-only). Increment `content_review_round` each time Content Review runs on a post-repair/post-rewrite candidate. Do not thrash the same finding cluster without a new hypothesis — convert to GAP / `BLOCKED` or surface as user-decidable `Q-*` when appropriate.

### Main-agent merge and routing

After review file(s) exist:

1. Fail closed if expected `reviews/content-review-<round>-*.md` files are missing.
2. Union and dedupe findings; apply high-risk merge rules when multiple lenses ran.
3. Adversarially spot-check top Critical/High findings (reopen anchors / seams).
4. Drop findings that fail recheck; keep unrefuted Critical attacks that stand.
5. Classify and route per `references/execution-graph.md` and `references/evidence-quality.md`.
6. Set `Ready for Draft Review handoff: Yes` only when Content Review result is in `{PASS, PASS_WITH_DISCUSSION, BLOCKED}`.

## Parallelism

- Max 4 ready units.
- Main agent writes all Unit Contracts into brief files BEFORE any parallel dispatch.
- Each parallel worker gets exactly one brief path.
- After join: main agent lists `briefs/*.md` and diffs against Accepted/Open units; any missing file is a hard error for that unit.
- Do not start Evidence Reconcile while any non-cancelled unit lacks a brief file.

Merge or sequence parent/child units or units sharing the same main path. Keep the immediate blocker on the main agent and continue useful non-overlapping work while sidecar units run. Do not duplicate delegated work locally.
