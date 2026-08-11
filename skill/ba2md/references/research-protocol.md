# Research Planning, Briefs, and Subagents

Use research to find raw facts that make the SDD implementable. Research units organize investigation; they are not document sections. Briefs summarize investigation; they never replace raw evidence.

Use `assets/research-brief-template.md` when a brief is needed.

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

## Selected Project Pairs
| Pair ID | Wiki root | Sources root | Role in requirement | Pair proof |
|---------|-----------|--------------|---------------------|------------|
| | `wiki/<id>` or `wiki/<id>/<project>` | `sources/<id>` | | |

## Candidate Project Impact Map
| Pair ID | Role | Requirement signals | Wiki/source basis | Expected impact | Decision | Exclusion reason |
|---------|------|---------------------|-------------------|-----------------|----------|------------------|

## Requirement-to-Project Coverage
| Requirement ID | Owning pair | Supporting pairs | Status | Notes |
|----------------|-------------|------------------|--------|-------|

## Cross-Project Boundary Coverage
| Boundary ID | Caller/producer pair | Provider/consumer pair | Boundary | Status | Evidence/GAP |
|-------------|----------------------|------------------------|----------|--------|--------------|

## Initial Current-System Anchors
| Pair ID | Concern | Candidate anchor | Confidence |
|---------|---------|------------------|------------|

## Research Units
| Unit ID | Trigger | Pair ID / Boundary | Concern | Questions | Expected facts | Dependencies | Status |
|---------|---------|--------------------|---------|-----------|----------------|--------------|--------|

## Execution State
- Current node:
- Resume node:
- Open research units:
- Accepted research units:
- Dirty sections:
- Blocking issues:
- Repair attempts by issue:
- Remaining search hypotheses:
- Last gate:
```

These tables prevent scope drift, but keep them lean. For ordinary single-pair work, one or two rows with explicit GAPs is better than a large speculative map.

## Draft Readiness vs Full Closure

Use the lightweight **Draft Readiness Check** by default. Before broad draft writing, confirm:

- the selected requirement unit has path/hash/anchors;
- inventory was taken from `ba2md discover` / `status` / `workspace.yaml` before content search;
- every managed source id and logical wiki project is selected or explicitly excluded in the Candidate Project Impact Map;
- the owning pair(s) have defensible wiki/source pairing proof with concrete `wiki/...` and `sources/<id>` roots (not bare collection roots);
- selected source roots are readable;
- load-bearing current facts are either `VERIFIED` or recorded as GAP;
- known material boundaries have an owner/endpoints, an explicit exclusion, or GAP;
- key target changes are represented as PROPOSAL/DECISION candidates;
- the active template's relevant output needs are understood well enough to write transparent draft sections.

Use **Full Closure Check** only for high-risk changes: multi-service contract changes, external APIs, database/schema migration, authorization/tenancy/security, money/accounting/audit, asynchronous events/jobs, release/rollback risk, or explicit user request. Full Closure additionally checks complete known boundary coverage, data/event ownership, strong candidate exclusions, and inventory coverage for affected APIs/interfaces/entities/jobs/config/metrics/alerts.

A failed Draft Readiness item returns to Project Discovery or Research. A critical missing fact can be a GAP in Draft but blocks Final.

## Unit Design

Derive research units from implementation concerns, not from template subsections. Use section constraints to decide what evidence the draft must contain; never create one brief per template subsection mechanically.

Split by disjoint `project pair × concern`, such as:

- request-to-persistence main path;
- API/contract fields, results, and errors;
- data model, migrations, transactions, and consistency;
- integrations, events, jobs, files, and failure handling;
- authorization, tenant boundaries, rate limits, audit, and sensitive data;
- observability, alerts, deployment, rollback, and tests;
- governing specs, standards, ADRs, and design documents.

Use a cross-pair unit only for an explicitly named integration boundary. State caller Pair ID, provider Pair ID, ownership, compatibility, and failure responsibility.

## When a Brief Is Mandatory

Create a brief when any condition holds:

- a subagent performs research;
- multiple project pairs are involved;
- interface, schema, permission, limit, alert, migration, rollback, or other load-bearing facts are researched;
- a spec/design/code conflict exists;
- Draft Writing or Quality Gate triggers repair research;
- an `ADD` decision needs existing-seam insufficiency evidence.

For a tiny single-pair task, use one consolidated brief. The canonical `evidence-registry.md` is always required, even when research is small.

## Subagent Assignment

Delegate only when the unit is independent, bounded, and has clear inputs/outputs. Default small or single-project work to the main agent. Do not delegate the immediate blocker if the next local step depends on it.

Give each subagent:

- the relevant requirement excerpt and requirement ID;
- exactly one Pair ID, or one named cross-pair boundary;
- selected wiki SUMMARY entry pages;
- **concrete** sources root (`sources/<id>` or deeper path inside it) and known anchors — never the bare `sources/` collection;
- bounded questions and expected evidence types;
- only relevant template constraints, never every section file;
- the Java test exclusion: `test.java`, `src/test/`, `*Test.java`, `*Tests.java`, and `*IT.java`;
- `assets/research-brief-template.md`;
- instruction to obey repository-local `AGENTS.md` and use context-graph tools before grep when available;
- instruction to search only under the assigned pair roots; do not run workspace-wide `sources/**` or `wiki/**` enumeration;
- instruction to report contrary, missing, and insufficient evidence;
- instruction not to edit the final design.

Do not leak expected answers. A recommendation must follow investigation of existing seams.

## Evidence Candidate Rules

Subagents assign candidate IDs and status `FOUND`. They must provide raw paths and line/symbol anchors, not brief paths, for FACT candidates. The main agent owns final IDs and resolves collisions while merging into the registry.

A subagent may report `SUMMARY`, `FACT`, `ASSUMPTION`, `GAP`, and `CONFLICT`; it must not mark a FACT `VERIFIED`.

## Brief Acceptance Gate

The main agent must:

1. confirm Pair ID or boundary scope;
2. reopen load-bearing raw anchors;
3. verify route composition, fields, symbols, schemas, permissions, limits, alerts, rollback, and operations claims when relevant;
4. promote accepted FACT candidates from `FOUND` to `VERIFIED` in the registry;
5. mark wrong candidates `REJECTED` with reason;
6. create follow-up or repair units only for new concrete search hypotheses;
7. update current-to-target decisions and affected sections.

Reject or repair a brief when:

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

Default to one Repair Research unit per unique missing-fact cluster. Create another only when the previous unit reveals a new concrete path, symbol, artifact type, source type, owner, project pair, boundary, or user-provided corpus. Never rerun the same searches through another subagent merely to seek a different answer.

Close a research unit successfully when either:

- usable raw FACT is found and verified by the main agent; or
- bounded search proves the corpus does not contain the required fact, and the absence is recorded as GAP with searched roots, queries, impact, and owner.

Do not turn factual GAPs into popup questions. The user is not responsible for guessing interfaces, fields, class names, thresholds, or configuration. A critical GAP may block Final, but it should remain visible in Draft and the gate report.

## Semantic Gate Subagent

Invoke an independent semantic gate subagent after a readable draft and evidence registry exist. Run mechanical validation before or in parallel when useful; a mechanical failure suppresses semantic review only when the draft or registry cannot be read.

- default: one comprehensive reviewer;
- high-risk or multi-project design: at most two reviewers, divided into evidence consistency and end-to-end design completeness.

Provide the draft, evidence registry, research plan, selected raw anchors, and active template constraints needed for the review. Require Findings in this form:

```markdown
| Finding ID | Type | Severity | Problem | Basis | Affected sections | Needs user | Recommended return stage |
|------------|------|----------|---------|-------|-------------------|------------|--------------------------|
```

The reviewer checks pairing, exact identifiers, boundary endpoints, current/target separation, existing-seam proof for `ADD`, irrelevant populated sections, missing acceptance/security/reliability/migration/rollback coverage, and user-decidable design choices.

A gate subagent must not edit the draft, promote FACTs, choose business outcomes, or declare final PASS. The main agent rechecks load-bearing Findings, deduplicates them, and routes them. Mechanical PASS never substitutes for semantic acceptance.

## Parallelism

Run at most four independent ready research units concurrently. Merge or sequence parent/child units or units sharing the same main path. Keep the immediate blocker on the main agent and continue useful non-overlapping work while sidecar units run. Do not duplicate delegated work locally.
