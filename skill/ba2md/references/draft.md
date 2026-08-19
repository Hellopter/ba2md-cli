# Draft, Content Review, and BA Loop

## Writing

Treat `{SKILL_DIR}/templates/` as the sole document-structure authority. Use only sections referenced by `templates/sdd.md`. The template supplies no facts.

Preconditions: wiki-plan/position exist; required units are accepted or GAP’d; registry is current; no load-bearing current fact remains only `FOUND` / `STALE` / `REJECTED`.

For each relevant template item: is it a current FACT, target PROPOSAL, or DECISION? Current facts need `VERIFIED` anchors. Otherwise GAP or a responsible PROPOSAL. Irrelevant sections stay blank/N/A/omitted as the template permits. Never fabricate because a heading exists.

Separate current (`F-*`), target (`P-*`), and decision (`D-*`). Prefer `REUSE` / `MODIFY` / `EXTEND`. Every `ADD` lists examined seams and why they are insufficient.

Cover dimensions the IR actually needs: entry/authz/validation; orchestration/state; persistence/transactions; interface fields/errors; events/jobs; logs/metrics/alerts; migration/rollout/rollback; tests.

Stop the affected section and repair-research when a load-bearing fact is missing (route, field, symbol, schema, permission, limit, alert, either boundary endpoint). If bounded research converges empty, record a GAP. Do not turn factual GAPs into BA questions.

Place evidence or claim IDs next to load-bearing statements.

## Mechanical precheck (subordinate)

```bash
ba2md check --product product/<slug>
```

This checks: wiki-plan legality; non-empty `briefs/` after accepted units; a `reviews/content-review-*.md` file when a draft exists. It does not judge design quality. Fix `ERROR`s locally and re-run. A check PASS never authorizes BA handoff.

## Content Review (primary)

Run on every readable draft. Reviewers emit findings only — they do not edit the draft, promote FACTs, choose business outcomes, or declare Final.

Default: one comprehensive adversarial reviewer. High-risk / Full Closure: up to three lenses in parallel — `evidence-consistency`, `e2e-completeness`, `adversarial-refuter`.

Output: `product/<slug>/reviews/content-review-<round>-<lens>.md` from `assets/content-review-report-template.md`. Return `REVIEW_WRITTEN <path>` + finding counts. Chat-only review is invalid for high-risk; default may have the main agent write the file from one response, but the file must exist.

Attack at least: unsupported precise identifiers; wiki/REQUIREMENT used as current implementation; `ADD` without seam insufficiency; missing failure/auth/rollback when relevant; brief claims not traceable in registry/draft.

Merge multi-lens reports by union; dedupe by `(section, problem fingerprint)`. Majority is not enough to pass: any Critical unrefuted attack that stands after main-agent recheck blocks clean handoff.

Route:

| Result | Next |
|--------|------|
| `RESEARCH_REQUIRED` | Repair Research → re-review (no BA) |
| `REVISION_REQUIRED` | Draft Writing → re-review (no BA) |
| `RECONCILE_REQUIRED` | Evidence Reconcile → re-review (no BA) |
| `PASS` / `PASS_WITH_DISCUSSION` | BA Draft Review |
| `BLOCKED` (no remaining hypothesis) | BA Draft Review with blocker package |

Cap `content_review_round` at 3. Keep looping while Critical agent-owned issues have a search/repair hypothesis. At cap with no hypothesis: `BLOCKED`, never paper over with `PASS_WITH_DISCUSSION`. `PASS_WITH_DISCUSSION` is only for user-owned backlog or non-critical discussion.

Full content review after IR/scope/source/evidence/API/schema/auth/data/event/rollback changes. Local review after wording-only edits. Always full review before a final candidate.

## BA interaction

Three gates. Not a nested skill.

### Gate A — Scope lock

See `references/wiki.md`. Only when a wrong answer would send research to the wrong tree.

### Gate B — Blocked-now

During research/writing, interrupt only for a user-owned product fork: two viable designs with different product impact, missing acceptance, or risk acceptance of a critical GAP. Never “what is the API path?”

### Gate C — Draft review

Enter only after Content Review result is in `{PASS, PASS_WITH_DISCUSSION, BLOCKED}`.

Present in one handoff, then **stop the turn**:

- draft path and gate result
- selected sources and recommended direction
- key evidence and `REUSE/MODIFY/EXTEND/ADD` decisions
- GAPs/CONFLICTs and whether they block Final
- critical backlog as a **menu** (load-bearing, user-decidable only) — do not ask the first item yet

BA leads. Free-form comments outrank the agent backlog. The BA may reject the framing, change scope, pick a backlog item, request research, edit wording, or confirm a candidate.

When the BA engages a fork, ask **one question per turn** with the recommended option first, known FACT/GAP/CONFLICT, and impact per option. Look up facts in wiki/sources/briefs/registry/draft instead of asking.

### Ask / never ask

Ask: IR meaning, in/out of scope, which products/systems, choice among already researched designs, risk acceptance, taste that reverses a visible call.

Never ask: paths, field names, class names, thresholds, config keys, permission codes, “does this wiki page look right?”, anything findable in the corpus.

### Classify BA comments and iterate

| Class | Route |
|-------|--------|
| interpretation | Requirement Intake → may rebuild wiki-plan |
| scope / wrong project | Wiki Consumption → research only new/omitted sources; **reuse existing briefs** |
| missing-fact | Repair Research (one unit per cluster) |
| design fork | Decision Map → rewrite affected sections |
| wording | Draft Writing local |

Write every resolution to the Decision Map (`Q-*` or `FREEFORM`, status, user choice, recommended option, rationale, evidence IDs, affected sections, needs new research, return node). Mark those sections `DIRTY`.

Re-run `ba2md check` plus the appropriate content-review level. Re-enter Draft Review with a **delta** (change summary, resolved items, remaining backlog), not a full re-walk.

Unasked backlog items stay listed. They do not unlock Final and do not authorize interrogation.

## Final

Create `{slug}.md` and set `status: final` only when all hold:

- the BA has seen the latest gated candidate and its change summary
- every BA-engaged critical decision is confirmed, deferred as non-final, or superseded
- every `DIRTY` section is rewritten
- check and Content Review pass (or transparent `BLOCKED` the BA accepted as non-final — then do not finalize)
- the BA explicitly confirms (`定稿` / `LGTM` / `确认终稿` / `finalize`)

Silence, “看起来还行”, or an empty backlog is not confirmation.
