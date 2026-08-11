# ba2md grilling (nested sub-skill)

Load **only** when Draft Review has already handed the floor and the user:

- opts into grilling (`grill` / `讨论` / `承重确认` / `逐项过` or equivalent); or
- engages a specific critical-backlog item or design choice that needs a decision.

Path: `{SKILL_DIR}/grilling/SKILL.md` — inside the ba2md package, **not** a global skill.  
Do **not** load this file during the initial Draft Review handoff turn.

## Inputs

- Current draft: `{WORKSPACE}/product/<slug>/<slug>.draft.md`
- Critical backlog: gate-report `Critical Backlog for User-Led Review` and/or registry `Q-*`
- Evidence registry: FACTs, GAPs, CONFLICTs, Decision Map
- Parent remains the owner of routing, rewrite, gate, and Final

## Before the first question

1. Read `{SKILL_DIR}/references/load-bearing.md`.
2. Build or refresh a **grill backlog** of 3–7 load-bearing items:
   - prefer user-engaged topics and draft-cited critical-backlog rows;
   - drop anything that fails the load-bearing bar;
   - cite draft section / design item / open risk for each entry.
3. Present the backlog briefly as a menu, then ask **only the first engaged or highest-priority item**.

## Grilling protocol

Interview the user on load-bearing design decisions until that branch is resolved or the user stops.

- **One question per turn.** Wait for the answer before the next. Multiple questions at once are bewildering.
- For each question include:
  - why it must be decided now;
  - known FACTs, GAPs, or CONFLICTs;
  - two or three options when useful;
  - the **recommended option first**, with rationale;
  - design / compatibility / migration / risk impact per option.
- If a *fact* is findable in `wiki/`, `sources/`, briefs, registry, or the draft, look it up — do not ask. The *decisions* are the user's.
- Never ask the user to guess implementation trivia (exact paths, field names, class names, thresholds, config keys, permission codes, alert names). Record those as GAPs for the parent.
- Prefer the user's newly raised concern over the remaining backlog order the moment it appears.
- Stop immediately when the user ends the grill, switches to free-form rewrite notes, or asks for a new draft.

## What this sub-skill must not do

- Do **not** write `{slug}.md` final.
- Do **not** wholesale-rewrite the draft mid-grill.
- Do **not** run Final admission.
- Do **not** invent FACTs or close critical GAPs by user guesswork.
- Decision capture during Q&A is for the Decision Map / chat log only; parent applies rewrites after the cluster clears (or immediately if new research is required).

## Recording resolutions

For every resolved item, return to the parent enough structure to write the Decision Map:

| Field | Content |
|-------|---------|
| Question ID | `Q-*` or `FREEFORM` |
| Status | `ACCEPTED` / `DEFERRED` / `SUPERSEDED` |
| User choice or change | verbatim decision |
| Recommended option | what the agent advised |
| Decision rationale | why this choice |
| Basis Evidence IDs | supporting FACT/GAP/CONFLICT IDs |
| Affected sections | draft sections to mark `DIRTY` |
| Needs new research | Yes/No |
| Return node | earliest affected parent node |

Unresolved leftovers when the user ends early become **仍生效假设** (still-active assumptions) for the parent to list on the next Draft Review handoff — not silent acceptances.

## Done when

- the grill backlog is empty; or
- the user stops grilling.

Then **stop** and return control to the parent Draft Review node so it can:

1. write Decision Map rows;
2. route to the earliest affected node;
3. research / reconcile / rewrite / gate as needed;
4. re-present the draft and hand the floor again.

Never auto-finalize after grilling.
