# Execution Graph, Backtracking, and Draft Review

## Node Contracts

| Node | Required input | Done when | Legal next nodes |
|------|----------------|-----------|------------------|
| Requirement Intake | User request, `requirements/`, active template folder | Requirement unit selected; path/hash/anchors recorded; goals, scope, constraints, acceptance, and non-goals captured; active template loaded | Project Discovery, User Decision |
| Project Discovery | Requirement interpretation | Relevant sources selected from wiki discovery; known material boundaries recorded or GAPed | Research Plan, User Decision |
| Research Plan | Selected sources and initial anchors | Units, dependencies, expected facts, graph state, and readiness level written | Research, Project Discovery |
| Research | One Unit Contract + empty/partial brief path | `briefs/<unit-id>.md` exists; Search Log present; candidates or bounded GAP recorded; unit status ready-for-acceptance | Brief Acceptance |
| Brief Acceptance | Brief file path(s) on disk + raw corpus | Main agent reopened brief + load-bearing raw anchors; FOUND→VERIFIED/REJECTED in registry; unit Accepted or Repair queued | Research, Evidence Reconcile, Project Discovery |
| Evidence Reconcile | VERIFIED evidence and issues | Current-to-target decisions, alternatives, assumptions, conflicts, and GAPs recorded | Draft Writing, Research, User Decision |
| Draft Writing | Registry, decisions, accepted evidence, active template | Draft sections contain traceable FACTs, explicit PROPOSALs/DECISIONs, and visible GAPs | Quality Gate, Repair Research, Project Discovery, User Decision |
| Quality Gate | Draft + registry + process artifacts | Mechanical and semantic results classified and routed | Draft Review, Draft Writing, Repair Research, Evidence Reconcile, Project Discovery, User Decision |
| Draft Review | Gated draft or revised candidate | Review package presented; user leads; resolutions recorded and routed; user explicitly confirms a final candidate | Final, Draft Writing, Research, Project Discovery, Requirement Intake, Evidence Reconcile |
| Final | Confirmed passing final candidate | Final validator passes and status is final | End |

Run this graph independently for each requirement unit in a directory queue. Do not share evidence registries or Decision Maps across units. When a requirement hash changes, return to Requirement Intake and propagate `DIRTY`.

### Research land-to-disk rule
A research unit is not done when the model "knows" the answer.
It is done when `briefs/<unit-id>.md` exists and is readable.
If a subagent returns prose without a brief file, the main agent must either:
1. write the brief from that prose into `briefs/<unit-id>.md` only when anchors are explicit and complete; or
2. mark the unit failed and re-dispatch with the brief path as the only deliverable.
Never promote evidence that exists only in chat.

## Execution State

Maintain this block in `research-plan.md`:

```markdown
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

Update it before leaving a node. `Resume node` records where to continue after a user decision or repair.

## Legal Back Edges

### Draft Writing → Repair Research

Trigger when a load-bearing statement needs a fact not present as `VERIFIED` evidence. Stop only the affected section, mark it `DIRTY`, and create a repair unit. Do not continue by guessing or by converting the missing fact into an unlabeled proposal.

### Quality Gate → Repair Research

Use for missing/wrong anchors, unknown exact identifiers, incomplete existing-seam investigation, unsupported security/operations claims, or critical GAPs with a new search hypothesis.

### Quality Gate → Draft Writing

Use when adequate verified evidence exists but the draft misstates, omits, duplicates, over-expands, or poorly structures it.

### Quality Gate → Evidence Reconcile

Use when evidence exists but authorities conflict, a change type is unjustified, or current versus target has not been decided.

### Quality Gate → Project Discovery

Use when evidence belongs to the wrong source, the owner source was omitted, selection basis is invalid, or a new material boundary appears.

### Any Node → User Decision

Use only for genuinely user-decidable product/business choices, requirement ambiguity, scope tradeoffs, or materially ambiguous project selection. Do not ask the user to guess missing implementation facts.

## Repair Research and Convergence

Name repair units `repair-<trigger>-<short-name>`, for example `repair-writing-rate-limit` or `repair-gate-api-path`.

A missing-fact cluster gets one initial research pass and, by default, one Repair Research pass. Permit another repair only when the previous pass reveals a new concrete search hypothesis: path, symbol, artifact type, source type, owner, source project, boundary, or user-provided corpus.

A complete inventory plus bounded literal/symbol searches that find no artifact is a valid negative result. Accept it as GAP instead of repeatedly delegating the same question. Critical GAP blocks Final, not Draft.

Track:

- repair attempts by issue;
- searches already performed;
- remaining concrete search hypotheses;
- convergence decision: `FACT_FOUND`, `GAP_RECORDED`, or `USER_INPUT_REQUIRED`.

For `CRITICAL_GAP`, return to Research only if a new search hypothesis exists. Otherwise keep the document in Draft, present the blocker, and request the responsible corpus or product decision only if the user can actually decide it.

## Dirty Propagation

Every registry record lists supported sections. Mark those sections `DIRTY` when evidence becomes `REJECTED`, `STALE`, or `SUPERSEDED`, or when its interpretation changes materially.

After repair:

1. verify new raw evidence;
2. update registry status and relationships;
3. update current-to-target decisions;
4. rewrite every dirty dependent section;
5. clear dirty markers only after rewrite;
6. rerun the appropriate gate.

Do not patch only the visible sentence if downstream design, tests, rollout, permissions, alarms, or rollback depend on the changed fact.

## Gate Routing Classes

| Failure class | Meaning | Return node |
|---------------|---------|-------------|
| `MECHANICAL` | Formatting, numbering, duplicate rows, resolvable missing ID reference | Fix locally; rerun mechanical validation |
| `WRITING` | Evidence is sufficient; wording or section coverage is wrong | Draft Writing |
| `EVIDENCE` | Missing, wrong, stale, or unverified raw fact | Repair Research |
| `CONFLICT` | Authorities disagree or decision is unresolved | Evidence Reconcile; research first if facts are missing |
| `SCOPING` | Wrong or incomplete source selection or ownership | Project Discovery |
| `DECISION` | Product/business/scope choice required | Draft Review (record on critical backlog; wait for user lead) |
| `CRITICAL_GAP` | Implementation cannot be responsibly finalized | Research only with a new search hypothesis; otherwise keep Draft and block Final |

The gate may fix `MECHANICAL` issues only. It must not invent routes, fields, symbols, thresholds, permissions, alarms, data models, or change rationales.

## Gate Rerun Level

Use the lightest gate that preserves integrity:

- **Mechanical validation** for formatting, IDs, placeholders, status, and anchor existence.
- **Local semantic review** for wording-only edits, table reshaping, section-local clarification, or non-load-bearing prose.
- **Full semantic gate** for requirement scope, selected source(s), source evidence, API/schema/auth/data/event/rollback, critical GAP/CONFLICT, existing-seam `ADD` proof, or final-candidate changes.

Always run full semantic gate before presenting a final candidate.

## Enter Draft Review

After a readable draft and gate report exist, enter Draft Review as a **user-led revision loop**. Present the review package, then stop and wait for the user.

### Review package

Present all of the following in one handoff, then end the turn:

- draft path and status;
- selected sources and why;
- recommended design direction;
- key evidence and source quality;
- key `REUSE/MODIFY/EXTEND/ADD` decisions;
- GAPs/CONFLICTs and whether they block Final;
- gate findings and routing;
- **critical backlog**: agent-recorded load-bearing questions from drafting/gating, each with short context only.

The critical backlog is a **menu**, not a script. List it; do not open the first item as a question, do not fire a structured popup, and do not start grilling in the same turn as the handoff.

Close the handoff by handing the floor: the user may raise their own concerns, pick a backlog item, request grilling, request research, request wording changes, or say the draft is ready to finalize.

## User-Led Intake and Grilling

**User lead first.** The user's free-form reaction outranks the agent's backlog order. The user may reject the whole framing, rewrite the requirement, change scope, propose another design, request more research, edit wording, pick a backlog item, ask to be grilled, or confirm a candidate.

**Load grilling only on demand.** When the user opts in (`grill` / `讨论` / `承重确认` / `逐项过` or equivalent) or engages a specific backlog item / design choice that needs a decision, Read and follow `{SKILL_DIR}/grilling/SKILL.md`. That nested sub-skill loads `references/load-bearing.md`, runs one load-bearing question per turn, and returns Decision Map fields to the parent.

Do **not** load `grilling/SKILL.md` on the handoff turn. Free-form feedback that needs no decision tree stays in the parent: write the Decision Map and route.

While grilling is active, the parent still owns routing, research, rewrite, gate, and Final. Grilling must not write the final document or wholesale-rewrite the draft. Stop grilling immediately when the user raises a different concern, ends the grill, or asks for a rewrite.

Agent-only backlog items the user never engages may remain listed; they do not authorize loading grilling, and they do not by themselves unlock Final.

## Decision Map and Routing

Write each confirmed decision or free-form user change to the evidence registry's Decision Map. Record the decision/change, rationale, supporting evidence, affected sections, whether new research is needed, return node, confirmer, and status.

Route feedback as follows:

| Feedback | Return node |
|----------|-------------|
| New or changed requirement file content, objective, acceptance criteria, or scope | Requirement Intake |
| New owning source or changed source ownership | Project Discovery |
| New source material, factual correction, or choice requiring new facts | Research / Brief Acceptance |
| Selection among already researched alternatives | Evidence Reconcile, then Draft Writing |
| Wording, table, or diagram change only | Draft Writing |
| Acceptance of a non-critical GAP/ASSUMPTION | Evidence Reconcile; return to writing only if the draft must reflect it |

When multiple feedback items exist, return to the earliest affected node: `Requirement Intake → Project Discovery → Research → Evidence Reconcile → Draft Writing → Quality Gate → Draft Review`.

Accumulate decisions that need no research until the current user-led cluster clears, then apply them together into a new draft. If a decision needs new facts, pause dependent grilling, return to research immediately, and resume only after the revised draft is re-presented.

After every routed change cycle, re-enter Draft Review with:

- the updated draft path;
- a change summary relative to the previous draft;
- resolved Decision Map items;
- remaining critical backlog;
- remaining non-critical GAPs.

Then hand the floor again. The loop continues until the user explicitly confirms a candidate.

## Final Convergence

The revision loop may end only when:

- the user has seen the latest gated candidate and its change summary;
- every user-engaged critical decision is confirmed, deferred as non-final, or superseded in the Decision Map;
- every free-form user change from the latest cycle is classified and applied;
- no open backtrack remains from the latest resolutions;
- every `DIRTY` section is rewritten;
- the required gate level passes;
- the user explicitly confirms that candidate as final (`定稿` / `确认终稿` / `finalize` or equivalent).

Silence, vague assent, or “the backlog is empty” is not confirmation. Generate the final document only after that explicit confirmation. Any content change before confirmation returns to the appropriate node, requires the appropriate gate, and re-enters Draft Review.

## Parallelism

The main agent owns discovery, acceptance, reconciliation, writing, routing, and user discussion. Delegate independent research units with disjoint source/concern scopes. Cap parallel subagents at four unless explicitly justified. Do not ask subagents to edit the final SDD.

- Max 4 ready units.
- Main agent writes all Unit Contracts into brief files BEFORE any parallel dispatch.
- Each parallel worker gets exactly one brief path.
- After join: main agent lists `briefs/*.md` and diffs against Accepted/Open units; any missing file is a hard error for that unit.
- Do not start Evidence Reconcile while any non-cancelled unit lacks a brief file.
