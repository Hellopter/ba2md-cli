# Evidence Model, Gate Findings, and Final Admission

## Contents

- Evidence priority and registry
- Requirement and FACT boundaries
- Template and precise-identifier rules
- Multi-project evidence closure
- Gate Findings and user decisions
- Final admission

## Evidence Priority

| Question | Preferred material |
|----------|--------------------|
| Objectives, scope, business rules, and acceptance | VERIFIED REQUIREMENT records from requirement Markdown |
| Current runtime behavior | Production code, configuration, deployment manifests, and migrations |
| External or internal contracts | Applicable specifications/standards, OpenAPI/proto/schema, composed routes, DTOs, and validators |
| Target architecture intent | Accepted ADRs or design documents reconciled with current code |
| Domain and scope positioning | Wiki SUMMARY; precise claims still require FACT |

Record the target branch, version, and date when available. Do not let an outdated design document silently override current code.

## Authoritative Registry

Use `evidence-registry.md` as the sole registry of evidence, issues, design claims, and user decisions. Research briefs and gate Findings are inputs only.

Use these IDs:

- `R-<REQ>-NNN`: REQUIREMENT
- `F-<SOURCE>-NNN`: FACT
- `S-<WIKI>-NNN`: SUMMARY
- `P-<FEATURE>-NNN`: PROPOSAL
- `D-<FEATURE>-NNN`: DECISION
- `A-<FEATURE>-NNN`: ASSUMPTION
- `G-<FEATURE>-NNN`: GAP
- `C-<FEATURE>-NNN`: CONFLICT
- `Q-<FEATURE>-NNN`: question pending user confirmation

Never reuse an ID for a different claim.

## REQUIREMENT Boundary

Index requirement files by path and title before reading the selected file in full. `VERIFIED REQUIREMENT` means the main agent rechecked the raw anchor and interpretation. It may support objectives, scope, business rules, and acceptance criteria, but it cannot replace FACT for current-system claims. When a requirement file changes, mark related `R-*` records `STALE`, return to requirement positioning, and propagate `DIRTY`.

## FACT Lifecycle

| Status | Meaning | May support precise current behavior? |
|--------|---------|---------------------------------------|
| `FOUND` | A researcher found a candidate | No |
| `VERIFIED` | The main agent reopened and confirmed raw evidence | Yes |
| `REJECTED` | The anchor or interpretation is wrong | No |
| `STALE` | The evidence may not match the target version | No |
| `SUPERSEDED` | Another record replaced it | No |

Only `VERIFIED` FACTs may support current APIs, fields, symbols, schemas, permissions, limits, alerts, configuration, or behavior.

## Evidence Rules for Template Content

The template defines output structure; it supplies no facts. For every template item relevant to the requirement:

- No VERIFIED FACT for current implementation: record a GAP rather than writing a deterministic current-state claim.
- Requirement sufficiently defines target behavior: write a PROPOSAL.
- Sufficient facts exist to compare alternatives: record a DECISION.
- Evidence remains insufficient for a responsible proposal: retain a GAP.
- Item is irrelevant: leave blank, summarize, write N/A, or omit as the active template permits.
- Never fabricate content merely because the template contains a section.

Do not discuss factual GAPs with the user as questions. Generate `Q-*` only for user-decidable matters such as business behavior, scope, risk acceptance, or a choice among viable designs.

## Verify Precise Identifiers

- **API**: compose the full path from application prefix, router/controller prefix, method route, and versioning rules; verify method, content type, authentication, types, and errors.
- **Field**: verify spelling, type, enum, optionality, default, constraints, and serialized name from DTOs, schemas, protos, models, and validators.
- **Symbol**: verify definition location, package/module path, and call relationship; keep proposed names as PROPOSAL.
- **Data**: verify tables, collections, entities, keys, constraints, indexes, transactions, migrations, and rollback from schemas or migrations.
- **Operations and security**: verify policy, tenant filters, rate-limit configuration, timeout/retry, metrics, alerts, audit, secrets, dashboards, and deployment parameters; otherwise record GAP or PROPOSAL.

Do not use Java test sources as current-system evidence.

## Multi-Project Evidence Closure

For a multi-source requirement, correctness is not the sum of isolated source findings. Verify the end-to-end graph:

- map every requirement item to one owning source and any dependent sources;
- verify both endpoints of caller/provider, producer/consumer, and writer/data-owner boundaries;
- reconcile request/response fields, event payloads, error semantics, timeouts, retries, idempotency, and version compatibility across endpoints;
- identify the actual data owner for every changed persisted domain;
- identify relevant consumers for every changed event or shared contract;
- record authorization, tenancy, configuration, deployment, alerting, and audit ownership where relevant;
- return to project discovery when source evidence reveals an unaccounted source, boundary, or owner;
- record compatibility evidence for a strongly related source that is excluded from the impact set.

Do not mark the impact set closed merely because each selected source was researched independently. It is closed only when requirement coverage and material cross-source edges are explained end to end or represented by explicit GAP/CONFLICT records.

## Gate Findings

Each Finding contains an ID, type, severity, problem, basis, affected sections, whether user input is needed, and recommended return stage.

Use these gate outcomes:

| Outcome | Meaning |
|---------|---------|
| `PASS` | No revision required; still enter Draft Review to hand the floor |
| `PASS_WITH_DISCUSSION` | Draft is presentable and carries a critical backlog for user-led review |
| `RESEARCH_REQUIRED` | Evidence is missing, incorrect, or unverified |
| `REVISION_REQUIRED` | Evidence is sufficient but design expression or coverage needs revision |
| `RECONCILE_REQUIRED` | Authoritative sources or design choices are unresolved |
| `BLOCKED` | A critical GAP has no remaining search hypothesis and blocks finalization |

The semantic gate is the primary content review and must run for every readable draft regardless of mechanical-validator status. Mechanical validation supplements semantic review with artifact, ID, anchor, and placeholder checks; it never proves scope or design completeness.

The semantic gate must check the level appropriate to the task:

**Always check:**

- every requirement item has an owning source or GAP, and every selected source has a selection basis;
- every known material cross-source boundary has both endpoints verified, explicitly excluded, or represented by GAP/CONFLICT;
- every precise current identifier resolves to a VERIFIED anchor;
- REQUIREMENT, SUMMARY, FACT, PROPOSAL, DECISION, ASSUMPTION, GAP, and CONFLICT are clearly separated;
- current implementation is not improperly supported by REQUIREMENT or wiki SUMMARY;
- active template sections are populated only when relevant or when the active template requires a visible placeholder/N/A;
- unsupported relevant template content is not fabricated or silently skipped;
- every `ADD` lists checked seams and insufficiency evidence;
- success, failure, authorization, timeout, retry, concurrency, migration, rollback, and operations are covered when relevant to the change;
- user-decidable questions are separated from factual GAPs;
- every dirty section has been rewritten before finalization.

**For Full Closure tasks, additionally check:**

- the candidate impact map explains all strong candidates and exclusions;
- every changed API, event, data domain, permission, job, configuration, metric, alert, and operations responsibility has an owner, explicit exclusion, or GAP;
- in-scope repeated items are inventoried completely rather than sampled;
- every required inventory item appears in the draft or has an explicit exclusion reason;
- end-to-end behavior remains coherent across all affected sources.

Do not require workspace-wide wiki scanning, complete inventories, or full closure for ordinary single-source tasks unless the change risk justifies it.

## User Discussion and Decision Map

Record agent-identified critical questions as `Q-*` in the gate report's critical backlog during Quality Gate / Draft Review preparation. `Q-*` items are backlog entries for the user to lead with — not an auto-play interview script.

Use `Q-*` only for matters the user can decide: business behavior, scope, risk acceptance, or a choice among viable designs. Separate them cleanly from factual GAPs. The live one-question grilling protocol lives only in `{SKILL_DIR}/grilling/SKILL.md`; do not restate it here.

In Draft Review:

1. present the review package and the critical backlog;
2. hand the floor and wait — do not open the first `Q-*` as a popup in the same turn;
3. follow the user's free-form concerns first;
4. on user lead or explicit opt-in only, Read `{SKILL_DIR}/grilling/SKILL.md` and run that nested protocol;
5. write every resolution and free-form change into the Decision Map;
6. route to the earliest affected node, revise, re-gate, and re-enter Draft Review until the user confirms a candidate.

The Decision Map must record at least: question or free-form change, selection/result, rationale, supporting evidence, affected sections, whether new research is needed, return stage/node, confirmer, and status. Unconfirmed critical questions that the user engaged block finalization. Unengaged backlog items stay listed as open context; they do not authorize agent-driven interrogation and do not alone unlock Final.

## Final Admission

Generate the final document only when all conditions hold:

- the user has seen the latest gated candidate and its change summary in Draft Review;
- every user-engaged critical decision is confirmed, deferred as non-final, or superseded in the Decision Map;
- free-form user changes from the latest review cycle are applied;
- all `DIRTY` sections are cleared;
- Draft Readiness remains valid, and Full Closure remains valid when the task required it;
- every known material cross-source boundary is verified end to end or represented by an admitted non-critical GAP;
- every precise current fact is supported by VERIFIED FACT;
- every `ADD` has insufficiency evidence;
- critical GAPs/CONFLICTs are resolved or correctly block finalization;
- deterministic validation and required semantic gate pass;
- the user explicitly confirms that candidate as final.
