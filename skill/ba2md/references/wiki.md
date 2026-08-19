# Wiki Consumption and Source Selection

Wiki and sources are independent collections. `wiki/` positions the corpus (identity, ownership, boundaries, terminology). `sources/` is the code. A requirement may touch several sources; missing a collaborator is the expensive failure mode this node exists to prevent.

Wiki text is `SUMMARY`. Read it as the map; cite precise identifiers only after a `FACT` from `sources/<id>`.

The wiki generator owns the tree. This file is how to *read* the current layout. If generation changes, update this skill — do not encode the topology in the CLI.

## 1. Inventory before search

In order. Do not skip ahead to workspace-wide `grep` / Glob.

1. Run `ba2md discover --json`. Fallback: `ba2md status --json`, then `workspace.yaml` + one-level listing of `sources/` and `wiki/`.
2. Record managed `sources/<id>` and `wiki/<id>`. Inventory is “what is mounted”, not “which pages to read”.
3. Reconcile disk vs registry at depth 1. Broken paths and orphans are notes, not silent drops.

Roots are always concrete (`sources/<id>`, `wiki/<id>/…`), never bare `sources/` or `wiki/`. Discover does not parse wiki page types. Page walking follows the layout below, under each `wiki/<id>/`.

## 2. Layout (v2)

Under `{WORKSPACE}/wiki/<id>/` (paths below are wiki-relative):

```text
wiki/
  index.md                        ← host-generated nav; skim links only; do not treat as Spec
  overview.md                     ← required (_root)
  architecture.md                 ← optional (_root)
  <source>/                       ← original source directory name, kept as-is
    index.md                      ← generated nav; skim
    source.md                     ← required: one per source
    <domain>/
      index.md                    ← generated nav; skim
      domain.md                   ← required: one per domain
      <concept>/
        index.md                  ← generated nav; skim
        concept.md                ← concept home
        models.md  / models/*.md  ← data
        flows.md / sequences.md   ← flow
        states.md                 ← state
        data.md                   ← data
        modules.md                ← module
```

`<source>` is the original source directory name. Do not invent slugs.

`index.md` at every level is generated navigation. Skim headings and links; never cite it as SUMMARY for ownership or behavior, and do not put it in the wiki-plan.

A page that the layout expects but is missing is a wiki GAP, not a reason to invent content or to fail the run.

## 3. Build the requirement wiki-plan

After IR intake, write:

| Path | Content |
|------|---------|
| `product/<slug>/wiki-plan.json` | `{ "pages": ["overview.md", "billing/source.md", …] }` — wiki-relative pages you will read. Working note, not a CLI schema |
| `product/<slug>/wiki-position.md` | Owning sources, collaborating sources or `none`, domains/concepts, vocabulary, wiki GAPs |

No wiki-plan → do not dispatch source research.

**How to choose pages**

1. Analyze the IR: goals, actors, objects, verbs, system names, in/out of scope. Keep `R-*` anchors.
2. Read `overview.md` in full. Read `architecture.md` in full when it exists.
3. List immediate `<source>/` directories. **Read every `source.md`.** These pages are cheap and are the collaboration map. Skipping one is how a cross-source IR is pinned to the wrong repo.
4. Select domains/concepts by IR terms **and** by neighbors named from those source pages (upstream/downstream, events, shared data, auth). Keyword-only matching is not enough.
5. For each selected concept cluster, read `domain.md` + `concept.md`. Pull `flows` / `states` / `data` / `modules` / `models/*` only when the IR needs that concern.
6. Put the Spec pages you scheduled into `wiki-plan.json` (no `index.md`, no `wiki/<id>/` prefix).

If overview/architecture/`source.md` names a neighbor relevant to the IR and the plan omitted it, add that `source.md` and re-evaluate. Wiki-position must name collaboration explicitly, even if the answer is `none`.

Stop reading wiki when wiki-position can state: owning source(s), collaborating source(s) or none, domain vocabulary to search in `sources/`, and what the wiki does not cover.

## 4. Scope lock (BA Gate A)

Present wiki-position in short form: IR interpretation, starting sources, collaboration, 0–3 questions.

Ask the BA **only if** a wrong answer would send research to the wrong tree:

- two or more sources could own the IR
- wiki says collaboration, IR does not (or the reverse)
- in vs out of scope would drop or add a system
- IR wording is ambiguous in a way that changes behavior

If the match is unambiguous (one owner, collaboration none or clearly named, IR terms line up), write wiki-position and continue. Do not turn every run into a questionnaire.

Never ask the BA to confirm wiki prose or guess implementation trivia.

## 5. Starting sources, then progressive expansion

Starting sources = sources named in wiki-position, mapped to managed `sources/<id>` by:

1. exact directory name equality with `<source>/`
2. explicit repository/source link in wiki metadata
3. normalized name (`-wiki` / `_wiki` stripped)
4. package/service identity in README or build manifest
5. domain ownership / integration names

A source with no wiki coverage is valid — record a wiki GAP and say why the IR still points at `sources/<id>`.

During research, add a source when evidence shows an import, call, shared contract, event, or data owner. Do not pre-exclude every managed source. “Unmentioned” means not yet evaluated.

Use Full Closure only for high-risk changes (multi-service contracts, schema, authz, money, jobs, rollback) or when the user asks for complete impact.

## 6. Forbidden

- Encoding wiki page-type rules in CLI, scripts, or a local copy of the generator’s `spec.ts`
- Enumerating *projects* with `grep`/`Glob` on `sources/**` or `wiki/**` (listing `wiki/<id>/*/source.md` after inventory is how you find sources)
- Treating `index.md` as Spec
- Concluding there is no wiki because `wiki/*.md` is empty
- Using bare `wiki/` or `sources/` as a search root
- Skipping `source.md` pages
- Starting research without `wiki-plan.json`
- Forcing one-to-one wiki↔source pairing
- Building a select-or-exclude table for every managed source before research
