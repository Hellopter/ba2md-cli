# Research Plan, Briefs, and Subagents

Research finds raw facts that make the SDD implementable. Units organize investigation; they are not document sections. Briefs summarize investigation; they never replace raw evidence.

Every completed unit writes `product/<slug>/briefs/<unit-id>.md` (shape: `assets/research-brief-template.md`). Tiny single-source work still produces one consolidated brief. Empty `briefs/` after Research is a protocol failure.

## Research plan

Write `product/<slug>/research-plan.md` with:

- Requirement input (path, SHA-256, `R-*` anchors) and interpretation (goal, actors, in/out, constraints, acceptance)
- Inventory source (`ba2md discover --json` or fallback) and wiki-plan path
- Starting sources from wiki-position (running note, derived from evidence — not a prerequisite for writing evidence)
- Requirement-to-source coverage and known cross-source boundaries
- Research units table
- Execution state

```markdown
## Research Units
| Unit ID | Trigger | Source ID / Boundary | Concern | Questions | Expected facts | Brief path | Dependencies | Status |
|---------|---------|----------------------|---------|-----------|----------------|------------|--------------|--------|
| | initial/repair | | | | | `briefs/<unit-id>.md` | | |

## Execution State
- Current node:
- Resume node:
- Open research units:
- Accepted research units:
- Dirty sections:
- Blocking issues:
- Remaining search hypotheses:
- content_review_round:
- Ready for Draft Review handoff: Yes/No
```

Keep tables lean. One or two rows with explicit GAPs beat a speculative map.

## Draft Readiness vs Full Closure

Default: Draft Readiness. Before writing, confirm: requirement anchors exist; inventory was taken before content search; wiki-plan and wiki-position exist; at least one starting `sources/<id>` is readable; load-bearing current facts are `VERIFIED` or GAP; known material boundaries have owner/endpoints, exclusion, or GAP.

Full Closure (multi-service contract, schema, authz, money, jobs, rollback, or user request) additionally requires complete known-boundary coverage and inventories of affected APIs/entities/jobs/config/alerts.

## Unit design

Split by disjoint `source × concern` (main path, contract fields, data/migrations, events/jobs, authz, ops). Use a cross-source unit only for a named integration boundary.

Never create one brief per template subsection. Section constraints decide what the draft must contain, not how many units to spawn.

## Unit I/O

Every unit — main-agent or subagent — is file-backed.

**Before work starts** the brief already contains a frozen `## Unit Contract`: unit id, trigger, source id or boundary id, concrete `sources/<id>/…` root, allowed wiki pages, `R-*` excerpts, bounded questions, expected fact types, out of scope, must-not-guess list, output path.

**Process:** search only under the assigned root (+ cited wiki pages). Write only this brief. Do not edit the plan, registry, draft, or other briefs.

**Done when** the brief has Search Log (including negative searches) and Evidence Candidates and/or bounded GAP rows. FACT in a brief is `FOUND` only. The main agent promotes `VERIFIED`.

**Dispatch:** write the brief with the contract filled, then spawn. Prompt must include the absolute brief path and: “Read and update only this file. Final action is saving this brief. Return only: `BRIEF_WRITTEN <path>` + candidate counts.” Do not accept a chat dump as the brief.

Default small or single-project work to the main agent. Cap parallel units at 4. One source per unit unless the unit is a named boundary. Exclude Java tests as in `SKILL.md`.

## Brief acceptance

After a batch, list `briefs/*.md` against open units. A missing file is `FAILED_NO_BRIEF` — re-dispatch or fill. Then, per brief:

1. Reject if Source ID/root drifted from the contract.
2. Reopen every load-bearing raw anchor.
3. Promote accepted FOUND → VERIFIED in `evidence-registry.md` (main agent only).
4. Reject wrong candidates with a reason.
5. Propagate newly discovered sources/boundaries into the plan as new units.

Also reject or repair when: an exact identifier has no raw anchor; wiki is the only support for a code-level claim; current and proposed behavior are mixed; `ADD` without inspecting existing seams; a boundary verifies only one endpoint; searches are claimed but not logged.

Merge non-overlapping sources first, then boundary units. Do not summarize from memory — reopen each brief.

## More research?

After acceptance, the main agent decides:

- new source, boundary, or concrete search hypothesis → another batch
- same searches, no new hypothesis → record GAP and stop

Do not rerun the same searches through another subagent to seek a different answer. A complete inventory plus bounded searches that find nothing is a valid negative GAP.

Repair units are named `repair-<trigger>-<short-name>`, one per missing-fact cluster, another only on a new concrete path/symbol/owner/source/boundary.

## IDs

- `R-<REQ>-NNN` REQUIREMENT
- `F-<SOURCE>-NNN` FACT
- `S-<WIKI>-NNN` SUMMARY
- `P-` / `D-` / `A-` / `G-` / `C-` / `Q-` proposal, decision, assumption, gap, conflict, BA question

Never reuse an ID for a different claim. Only `VERIFIED` FACT supports precise current identifiers or behavior.
