# Template-Driven Evidence Writing

Treat the active `{SKILL_DIR}/templates/` directory as the sole document-structure authority. `templates/sdd.md` defines the skeleton; referenced section constraints define output shape and quality. Use only constraints referenced by the active template. Do not hardcode chapter numbers or blank-section policy in the skill.

The template tells you what the document may contain; it does not prove that facts exist and it must not mechanically create research units.

Write the document's prose in the workspace language (`workspace.yaml` `language:`, default `zh`), following the active template for structure and headings. Keep evidence anchors, IDs, and code identifiers (paths, symbols, fields, routes, schema/config names) verbatim; never localize them.

## Writing Preconditions

Before starting or resuming writing, confirm that:

- requirement interpretation is captured from VERIFIED REQUIREMENT records;
- selected sources and known material boundaries are recorded;
- Draft Readiness has passed, or Full Closure has passed when the task requires it;
- required research units are accepted or explicit GAPs are recorded;
- `evidence-registry.md` is current;
- each current-to-target change type is classified;
- no load-bearing current fact remains only `FOUND`, `STALE`, or `REJECTED`.

Do not use wiki text, a research brief, or content-review findings as final evidence.

## Evaluate Each Active Template Item

For each active template item relevant to the requirement, determine in order:

1. Is it relevant to this requirement and selected scope?
2. Is each statement a current fact, target proposal, or design decision?
3. Does each current fact have a VERIFIED anchor?
4. If no current fact exists, does the requirement support a responsible PROPOSAL?
5. If evidence is still insufficient, has a GAP been recorded?
6. If the item is irrelevant, does the active template permit leaving it blank, writing N/A, or omitting it?

Do not populate frontend or any other conditional section merely because its heading exists. For relevant but unsupported content, never fabricate or silently hide a critical GAP.

## Inventory-to-Draft Traceability

Use the Implementation Inventory only to the level justified by task risk.

- Ordinary task: trace every load-bearing changed item and every known material boundary.
- Full Closure task: trace every in-scope repeated item required by the closure check.

Every item marked in scope must appear in the designated draft section with evidence/claim IDs. Every discovered item omitted from the draft must have an explicit exclusion reason. Do not collapse multiple known affected interfaces/events/entities into one generic example when the exact set matters to implementation.

## Separate Current State, Target State, and Decisions

- **Current implementation (FACT)**: existing behavior, annotated with `F-*`.
- **Target change (PROPOSAL)**: new or changed behavior, annotated with `P-*`.
- **Design decision (DECISION)**: selected option, alternatives, and rationale, annotated with `D-*`.
- Use `A-*`, `G-*`, or `C-*` for unresolved assumptions, gaps, or conflicts.

Prefer `REUSE`, `MODIFY`, or `EXTEND`. For `ADD`, list the existing seams examined and explain why each is insufficient.

## Implementation Depth

Cover dimensions relevant to the requirement and risk:

- caller, entry conditions, authentication, authorization, and validation;
- orchestration, domain decisions, state, and invariants;
- persistence, transactions, consistency, and concurrency;
- interface fields, errors, compatibility, idempotency, and timeouts;
- integrations, events, jobs, retries, and compensation;
- logs, metrics, traces, alerts, and audit;
- configuration, migration, release, rollout, and rollback;
- tests and acceptance traceability.

Use Mermaid for complex sequences, states, or boundaries. Existing identifiers must be verified; new names must be explicitly marked as proposals.

## Stop-Writing Conditions

Stop the affected section and return to repair research when any load-bearing fact is missing:

- complete route or contract fields;
- class, method, call relationship, or owning module;
- table, index, transaction, migration, or rollback behavior;
- authorization, tenancy, rate limit, timeout, retry, alert, audit, or deployment mechanism;
- existence or sufficiency of an extension seam;
- either endpoint, ownership, contract, or compatibility of a material cross-source boundary;
- completeness of an inventory that is required for this task's risk level.

If bounded research converges without evidence, record a GAP. Non-critical GAPs may remain visible; critical GAPs block finalization. Never turn a factual gap into a user popup question. When drafting surfaces a user-decidable tradeoff, record it as a critical-backlog `Q-*` for Draft Review instead of interrupting writing with an interview.

## User Feedback and Rewriting

Write every user decision or free-form change to the Decision Map and list affected sections. When evidence, decisions, or user feedback changes, mark every dependent section `DIRTY`.

- No new facts needed: apply accumulated decisions after the current user-led cluster clears, then rewrite.
- New facts needed: pause dependent grilling and return to research immediately.
- Requirement or project scope changed: return to Requirement Intake or Project Discovery.
- Wording-only change: rewrite directly.

After rewriting, clear valid dirty markers and rerun the appropriate Quality Gate level: mechanical precheck, local content review, or full content review. Re-enter Draft Review only after Content Review authorizes handoff again (`Ready for Draft Review handoff: Yes`), with a change summary and an updated critical backlog. Present a final candidate only after the required gate passes; generate the final document only after explicit user confirmation.

## User-Visible Evidence

Place evidence or claim IDs next to load-bearing statements and table rows. The document's evidence section should show selected sources, key raw anchors, design decisions, conflicts, assumptions, and GAPs so users can judge credibility directly. Do not replace this with an opaque confidence score.
