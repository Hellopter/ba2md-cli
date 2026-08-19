# Wiki Consumption and Source Selection

Wiki and sources are independent collections. `wiki/` positions the corpus (identity, ownership, boundaries, terminology). `sources/` is the code. A requirement may touch several sources; missing a collaborator is the expensive failure mode this node exists to prevent.

Wiki text is `SUMMARY`. Read it as the map; cite precise identifiers only after a `FACT` from `sources/<id>`.

## 1. Inventory before search

In order. Do not skip ahead to `grep` / Glob.

1. Run `ba2md discover --json`. Fallback: `ba2md status --json`, then `workspace.yaml` + one-level listing of `sources/` and `wiki/`.
2. Record managed `sources/<id>` and `wiki/<id>`. Inventory is not selection.
3. Reconcile disk vs registry at depth 1. Broken paths and orphans are notes, not silent drops.
4. If a wiki entry is `shape: wiki-spec-v2`, use `wikiSpec.spec.pages` as the page list. Do not glob `wiki/**` to enumerate pages.
5. If the entry is `nested-projects` / `single` / `mixed` (no v2 spec), keep the old layout: logical projects are the entry root or immediate children with overview/index pages. Record `wiki-spec: absent` as a discovery GAP and continue.

Roots are always concrete (`sources/<id>`, `wiki/<id>/…`), never bare `sources/` or `wiki/`.

## 2. Build the requirement wiki-plan

After IR intake, write:

| Path | Content |
|------|---------|
| `product/<slug>/wiki-plan.json` | `{ "pages": [...], "topologyVersion": 2 }` — subset of the inventory |
| `product/<slug>/wiki-position.md` | Owning sources, collaborating sources or `none`, domains/concepts, vocabulary, wiki GAPs |

No wiki-plan → do not dispatch source research. `ba2md check` rejects a plan whose pages are illegal or not in the inventory.

**How to choose pages**

1. Analyze the IR: goals, actors, objects, verbs, system names, in/out of scope. Keep `R-*` anchors.
2. Always read `overview.md` and `architecture.md` in full when they exist (mental model).
3. **Always read every `source.md` in the inventory.** These pages are cheap and are the collaboration map. Skipping one is how a cross-source IR is pinned to the wrong repo.
4. Select domains/concepts by IR terms **and** by neighbors named from those source pages (upstream/downstream, events, shared data, auth). Keyword-only matching is not enough.
5. For each selected concept cluster, read `domain.md` + `concept.md`. Pull `flows` / `states` / `data` / `modules` / `models/*` only when the IR needs that concern.
6. Put the pages you actually scheduled into `wiki-plan.json`. Include `overview.md` when the inventory has it, and at least one `source.md`.

Legal v2 paths (wiki-relative, no `wiki/<id>/` prefix):

- `overview.md`, `architecture.md`
- `<source>/source.md`
- `<source>/<domain>/domain.md`
- `<source>/<domain>/<concept>/{concept,models,flows,sequences,states,data,modules}.md`
- `<source>/<domain>/<concept>/models/<entity>.md`

If architecture or a `source.md` names a neighbor relevant to the IR and the plan omitted it, add that `source.md` and re-evaluate. Wiki-position must name collaboration explicitly, even if the answer is `none`.

Stop reading wiki when wiki-position can state: owning source(s), collaborating source(s) or none, domain vocabulary to search in `sources/`, and what the wiki does not cover.

## 3. Scope lock (BA Gate A)

Present wiki-position in short form: IR interpretation, starting sources, collaboration, 0–3 questions.

Ask the BA **only if** a wrong answer would send research to the wrong tree:

- two or more sources could own the IR
- wiki says collaboration, IR does not (or the reverse)
- in vs out of scope would drop or add a system
- IR wording is ambiguous in a way that changes behavior

If the match is unambiguous (one owner, collaboration none or clearly named, IR terms line up), write wiki-position and continue. Do not turn every run into a questionnaire.

Never ask the BA to confirm wiki prose or guess implementation trivia.

## 4. Starting sources, then progressive expansion

Starting sources = sources named in wiki-position, mapped to managed `sources/<id>` by:

1. explicit repository/source link in wiki metadata
2. exact directory name equality
3. normalized name (`-wiki` / `_wiki` stripped)
4. package/service identity in README or build manifest
5. domain ownership / integration names

A source with no wiki coverage is valid — record a wiki GAP and say why the IR still points at `sources/<id>`.

During research, add a source when evidence shows an import, call, shared contract, event, or data owner. Do not pre-exclude every managed source. “Unmentioned” means not yet evaluated.

Use Full Closure only for high-risk changes (multi-service contracts, schema, authz, money, jobs, rollback) or when the user asks for complete impact. Full Closure is coverage of the IR’s material boundaries, not a tour of every registered repo.

## 5. Forbidden

- Enumerating projects with `grep`/`Glob` on `sources/**` or `wiki/**`
- Treating a truncated hit list as the project set
- Concluding there is no wiki because `wiki/*.md` is empty
- Using bare `wiki/` or `sources/` as a search root
- Skipping inventory `source.md` pages
- Starting research without `wiki-plan.json`
- Forcing one-to-one wiki↔source pairing
- Building a select-or-exclude table for every managed source before research
