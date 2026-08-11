# Execution Graph, Backtracking, and Draft Review

## Node Contracts

| Node | Required input | Done when | Legal next nodes |
|------|----------------|-----------|------------------|
| Requirement Intake | User request, `requirements/`, active template folder | Requirement unit selected; path/hash/anchors recorded; goals, scope, constraints, acceptance, and non-goals captured; active template loaded | Project Discovery, User Decision |
| Project Discovery | Requirement interpretation | Minimal plausible wiki↔sources pair set selected; known material boundaries recorded or GAPed | Research Plan, User Decision |
| Research Plan | Selected pairs and initial anchors | Units, dependencies, expected facts, graph state, and readiness level written | Research, Project Discovery |
| Research | One bounded unit | Brief or direct notes produced with evidence candidates or bounded negative result | Brief Acceptance |
| Brief Acceptance | Brief/direct notes + raw artifacts | Load-bearing candidates verified/rejected; registry and affected sections updated | Research, Evidence Reconcile, Project Discovery |
| Evidence Reconcile | VERIFIED evidence and issues | Current-to-target decisions, alternatives, assumptions, conflicts, and GAPs recorded | Draft Writing, Research, User Decision |
| Draft Writing | Registry, decisions, accepted evidence, active template | Draft sections contain traceable FACTs, explicit PROPOSALs/DECISIONs, and visible GAPs | Quality Gate, Repair Research, Project Discovery, User Decision |
| Quality Gate | Draft + registry + process artifacts | Mechanical and semantic results classified and routed | Draft Review, Draft Writing, Repair Research, Evidence Reconcile, Project Discovery, User Decision |
| Draft Review | Gated draft or final candidate | User decisions and free-form feedback recorded, routed, and applied; user confirms final candidate | Final, Draft Writing, Research, Project Discovery |
| Final | Confirmed passing final candidate | Final validator passes and status is final | End |

Run this graph independently for each requirement unit in a directory queue. Do not share evidence registries or Decision Maps across units. When a requirement hash changes, return to Requirement Intake and propagate `DIRTY`.

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

Use when evidence belongs to the wrong project pair, the owner project was omitted, pair proof is invalid, or a new material boundary appears.

### Any Node → User Decision

Use only for genuinely user-decidable product/business choices, requirement ambiguity, scope tradeoffs, or materially ambiguous project selection. Do not ask the user to guess missing implementation facts.

## Repair Research and Convergence

Name repair units `repair-<trigger>-<short-name>`, for example `repair-writing-rate-limit` or `repair-gate-api-path`.

A missing-fact cluster gets one initial research pass and, by default, one Repair Research pass. Permit another repair only when the previous pass reveals a new concrete search hypothesis: path, symbol, artifact type, source type, owner, project pair, boundary, or user-provided corpus.

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
| `PAIRING` | Wrong or incomplete wiki↔sources ownership | Project Discovery |
| `DECISION` | Product/business/scope choice required | Draft Review/User Decision |
| `CRITICAL_GAP` | Implementation cannot be responsibly finalized | Research only with a new search hypothesis; otherwise keep Draft and block Final |

The gate may fix `MECHANICAL` issues only. It must not invent routes, fields, symbols, thresholds, permissions, alarms, data models, or change rationales.

## Gate Rerun Level

Use the lightest gate that preserves integrity:

- **Mechanical validation** for formatting, IDs, placeholders, status, and anchor existence.
- **Local semantic review** for wording-only edits, table reshaping, section-local clarification, or non-load-bearing prose.
- **Full semantic gate** for requirement scope, selected project pair, source evidence, API/schema/auth/data/event/rollback, critical GAP/CONFLICT, existing-seam `ADD` proof, or final-candidate changes.

Always run full semantic gate before presenting a final candidate.

## Enter Draft Review

After a readable draft and gate report exist, present a review summary before asking questions:

- draft path and status;
- selected project pairs and why;
- recommended design direction;
- key evidence and source quality;
- key `REUSE/MODIFY/EXTEND/ADD` decisions;
- GAPs/CONFLICTs and whether they block Final;
- gate findings and routing;
- agent-identified critical decisions.

Treat this as collaborative design review, not a questionnaire. The purpose is to let the user react to the draft, the evidence, and the design tradeoffs.

## Discussion Protocol

When a critical user-decidable question exists, handle one at a time. Each question should include:

- the question and why it must be decided now;
- known FACTs, GAPs, or CONFLICTs;
- two or three options when useful;
- the recommended first option and rationale;
- each option's design, compatibility, migration, and risk impact.

Every discussion round must also permit free-form feedback. The user may choose an option, reject the framing, introduce a new requirement, propose another solution, change scope, request more research, or ask for wording changes.

Do not treat the agent's question queue as exhaustive user feedback. After resolving all critical questions, explicitly ask whether the user wants changes to requirement interpretation, scope, design choices, risk treatment, evidence presentation, or wording before preparing the final candidate.

Do not ask the user to guess missing implementation details such as interfaces, fields, class names, thresholds, configuration, permissions, or alerts. Record those as GAPs.

## Decision Map and Routing

Write each confirmed decision or free-form user change to the evidence registry's Decision Map. Record the decision/change, rationale, supporting evidence, affected sections, whether new research is needed, return node, confirmer, and status.

Route feedback as follows:

| Feedback | Return node |
|----------|-------------|
| New or changed requirement file content, objective, acceptance criteria, or scope | Requirement Intake |
| New owning project or changed project ownership | Project Discovery |
| New source material, factual correction, or choice requiring new facts | Research / Brief Acceptance |
| Selection among already researched alternatives | Evidence Reconcile, then Draft Writing |
| Wording, table, or diagram change only | Draft Writing |
| Acceptance of a non-critical GAP/ASSUMPTION | Evidence Reconcile; return to writing only if the draft must reflect it |

When multiple feedback items exist, return to the earliest affected node: `Requirement Intake → Project Discovery → Research → Evidence Reconcile → Draft Writing → Quality Gate → Draft Review`.

Accumulate decisions that require no research until the current discussion cluster clears, then apply them together. If a decision requires new facts, pause dependent questions, return to research immediately, and resume unresolved questions afterward.

## Final Convergence

Discussion converges when:

- every critical user-decidable question is confirmed or explicitly deferred as non-final;
- the user has had an open-ended modification opportunity after the agent's questions;
- user changes are classified and applied;
- no new requirement, project, or evidence backtrack remains;
- every `DIRTY` section is rewritten;
- the required gate level passes.

Then present the updated final candidate, a change summary relative to the previous version, resolved issues, and remaining non-critical GAPs. Generate the final document only after explicit user confirmation. Any content change before confirmation returns to the appropriate node and requires the appropriate gate again.

## Parallelism

The main agent owns discovery, acceptance, reconciliation, writing, routing, and user discussion. Delegate independent research units with disjoint project-pair/concern scopes. Cap parallel subagents at four unless explicitly justified. Do not ask subagents to edit the final SDD.
