# Source Discovery and Selection

Use this phase to identify the starting source for a requirement, not to perform deep implementation research and not to pre-declare the full set of sources upfront.

Wiki and sources are **independent collections**. `wiki/` is a discovery/positioning layer that spans the source corpus; `sources/` is the corpus of codebases. There is no one-to-one pairing: one wiki entry may inform several sources, one source may be informed by several wiki entries or none, and a source may be selected with no wiki coverage at all.

**Selection is progressive** (defined in section 3): a source enters scope when you write evidence anchored under `sources/<id>`, and you add more only as evidence surfaces them — never by pre-selecting or pre-excluding every managed source upfront.

**Hard rule:** finish the inventory (what sources/wiki exist) before any workspace-wide content search. Content search may only run inside an already-identified source root (or a specific wiki page).

## 0. Mandatory Inventory Order

Do these steps in order. Do not skip ahead to `grep`, `Glob`, or symbol search.

1. **Read the workspace registry.** Prefer, in order:
   - `ba2md discover --json` (best: managed entries + logical projects);
   - else `ba2md status --json`;
   - else read `{WORKSPACE}/workspace.yaml` and list one level of `{WORKSPACE}/sources/` and `{WORKSPACE}/wiki/`.
2. **Record the inventory** of managed `sources/<id>` and `wiki/<id>` entries. Inventory = "what sources and wiki exist". It is **not** a selection. You do not decide upfront which sources this requirement touches.
3. **Reconcile disk vs registry.** List immediate children of `sources/` and `wiki/` only (depth 1). Match names to registry ids. Record missing paths as broken; record unregistered directories as orphans to evaluate, not to ignore silently.
4. **Expand logical projects** (section 1) so you know the shape of each wiki entry.
5. **Read the requirement**, then read the **requirement-relevant** wiki pages to learn which sources likely matter.
6. **Pick the most relevant source to start**, then begin research. **Only then** may content search run, and only under a concrete root such as `sources/<source-id>/` or `wiki/<wiki-id>/`.

Inventory is fixed; **selection is progressive**. You may start with one source and add more as evidence surfaces them (section 3).

## 1. Locate Roots and Expand Logical Projects

Prefer `{WORKSPACE}/wiki/` and `{WORKSPACE}/sources/`. If `sources/` is absent and `souces/` exists, use `souces/` and record that spelling in process artifacts.

### Managed entry vs logical project

| Layer | Path shape | Meaning |
|-------|------------|---------|
| Collection root | `sources/`, `wiki/` | Not a project. Never use as a source root or search root by itself. |
| Managed entry | `sources/<id>/`, `wiki/<id>/` | One CLI-registered resource from `workspace.yaml`. |
| Logical project | managed entry root, or one child under a nested wiki entry | Selectable unit that may own requirement behavior. |

### Sources expansion

Each readable `sources/<id>/` is normally **one** logical source project. Record:

- managed id and path `sources/<id>`;
- identity signals: root `README*`, build manifests (`pom.xml`, `build.gradle*`, `package.json`, `go.mod`, `Cargo.toml`, `*.sln`, `*.csproj`), service name, top-level package/module dirs;
- whether the tree looks like a monorepo (multiple deployable modules). Still keep **one source per managed id** unless the requirement clearly targets separable repos that were incorrectly bundled; do not collapse multiple managed ids into one selected source.

### Wiki expansion (nested-layout rule)

For each readable `wiki/<id>/`:

1. If the entry root itself has overview/index material (`index.md`, `README.md`, `overview*`, `introduction*`, `architecture*`, nav index), treat the **entry root** as one logical wiki project at `wiki/<id>`.
2. Else if the entry root has **no** such entry pages, but one or more **immediate child directories** do, treat **each child** as a logical wiki project at `wiki/<id>/<child>/`. This is the common "docs monorepo" layout.
3. Else if both the root and some children look like projects, prefer the root as the primary project and list strong child areas as modules or additional candidates with explicit reasons.
4. Never conclude "no wiki" because `wiki/*.md` is empty. Managed wiki entries are often directories whose Markdown lives one level deeper.

A collection root may itself be one project only when it is **not** using the managed multi-entry layout (no `workspace.yaml` ids) and it contains overview/index material plus source-manifest characteristics. In a normal ba2md workspace, always go through managed ids.

Wiki coverage of a source is **optional**. A source may have zero, one, or many wiki pages that describe it; absent coverage is recorded as a discovery GAP, not a selection failure.

### Lightweight index fields

Build a lightweight index without loading every page in full. Capture:

- managed id, logical project path, and likely identity;
- title/frontmatter and H1/H2 headings on entry pages only;
- locations of `index.md`, `README.md`, `overview*`, `introduction*`, `architecture*`, system-context, and domain-index pages;
- links or names that suggest upstream/downstream systems;
- likely matching managed source id;
- requirement keyword, title, alias, and domain-term matches.

## 2. Read Wiki Entry Pages for Discovery

Read the wiki on demand, driven by the requirement — not the whole wiki up front. The flow is: read the requirement → read the wiki pages whose titles/headings/domain terms match the requirement → from those pages learn which sources exist and which likely matter → start researching the most relevant one.

**How deeply to read is governed by page role, not by length.** Navigation pages (`index.md`, `README.md`) are skimmed for the module map; total-view pages (`overview*`, `introduction*`, `architecture*`, system-context, domain-index) are read **in full** to build the system mental model; detail pages are pulled on demand. The full reading-depth tiers, the two consumption modes (understand/lock-scope vs evidence-collection), and the trust boundary ("read deeply as your map, cite as a SUMMARY") are defined in `references/wiki-consumption.md` — read it. Under-reading the total-view tier is the common failure mode that makes the wiki feel useless; the wiki pays for itself by narrowing and de-risking later source research.

A wiki project is worth reading when any of these apply:

- its name, title, headings, aliases, or domain terms match the requirement;
- it is linked from a plausible owner source's context;
- it may describe an upstream/downstream boundary, data domain, event producer/consumer, authorization rule, scheduled job, frontend, deployment, alert, or operations responsibility;
- source reconnaissance later points back to it;
- it is the only registered wiki entry (still reference it via `wiki/<id>`).

For each plausible wiki project, inspect in this order when present (navigation pages skimmed; total-view pages read in full — see `references/wiki-consumption.md`):

1. root `index.md`, `README.md`, or navigation index;
2. primary `overview*`, `introduction*`, `architecture*`, system-context, or domain-index pages;
3. pages whose titles or index descriptions match requirement signals;
4. pages linked as contract, event, data, authorization, deployment, or operations dependencies.

For small workspaces, scanning every wiki project's entry pages is acceptable. For large workspaces, expand beyond plausible projects only when ownership or a material boundary remains unresolved. **Small vs large does not waive the inventory of managed ids.**

Capture only:

- source identities, ownership, and boundaries the wiki describes;
- domain vocabulary and aliases;
- major modules or bounded contexts;
- upstream/downstream systems;
- APIs, events, jobs, or data domains that may form boundaries;
- likely source repository or package names;
- requirement matches, mismatches, and unresolved ownership.

Wiki content is `SUMMARY`: record search hypotheses and ownership here, but verify precise identifiers against `sources/<id>` before any becomes a `FACT`. This is a citation rule, not a reason to skim — read total-view pages fully so you know where to dig. (`references/wiki-consumption.md` covers the full trust boundary.)

## 3. Select Sources Progressively

Selection is **progressive, not upfront**. The flow is:

```
read requirement → read requirement-relevant wiki → pick the most relevant source
→ research it → (evidence surfaces another source) → add that source → research it → …
```

A source enters scope the moment you write evidence anchored under `sources/<id>`. **There is no separate "select before you write" step, and no requirement to pre-select or pre-exclude every managed source.** The evidence registry is the source of truth for which sources are in scope: if `evidence-registry.md` contains anchors under `sources/svc-a` and `sources/svc-b`, then both are selected — regardless of what any selection table says.

You may keep an optional Selected Sources table as a running note of what you believe is in scope, but:

- it is **derived from evidence**, not a prerequisite for it;
- it is **append-only as evidence grows** — never go back and "exclude" sources you have not investigated just to satisfy a checklist;
- the mechanical validator does **not** read it and does **not** fail when sources are unmentioned.

### Starting selection

Pick the source to start from using wiki discovery, in this signal order:

1. explicit repository/source link in wiki metadata describing this source;
2. exact directory name equality between a logical wiki project and the managed source id;
3. normalized name after stripping suffixes such as `-wiki`, `_wiki`, `.wiki`;
4. matching package/service identity in README, build manifest, deployment metadata, or source root;
5. matching domain ownership and integration names.

A source selected purely on requirement grounds (with no wiki coverage) is valid — note the missing wiki coverage as a discovery GAP.

### Expanding selection during research

When research or human review reveals that another source is relevant (an import, a call, a shared contract, an event producer/consumer, a data owner), add it to scope by researching it and writing evidence anchored under `sources/<id>`. Do **not** maintain a "full closure" of all managed sources unless the task is high-risk (section 5, Full Closure). For ordinary work, "unmentioned" means "not yet evaluated", not "excluded".

## 4. Perform Shallow Source Reconnaissance

Before freezing scope, inspect only identity and likely seams for selected or strongly plausible sources **inside each selected source's root**:

- build manifests and service identity;
- root package/module layout and startup entry points;
- router/controller locations;
- domain modules and public interfaces;
- DTO/schema/proto locations;
- migration/schema directories;
- message, event, and scheduled-job definitions;
- configuration, deployment, and observability directories.

Use this pass to confirm source identity, locate likely main paths, and detect dependencies omitted or outdated in wiki. Do not perform exhaustive implementation analysis here.

If reconnaissance reveals an unaccounted material source, return it to wiki reading and selection. Source evidence may expand or correct wiki-derived scope.

## 5. Rank Sources and Decide Closure

Rank candidate sources by: direct ownership of the behavior; requirement vocabulary in wiki entry pages or source roots; current implementation anchors; upstream/downstream relevance; data/event/authorization/job/operations ownership; and evidence recency when known. Add more only when evidence shows each contributes a distinct part of the requirement or a material boundary that may be affected.

A normal task may begin deep research once the starting owner source, known material boundaries, and unresolved GAPs are recorded. Do not force a workspace-wide closure pass unless the change is high-risk or the user requests complete impact analysis.

Use a **Full Closure Check** only when the change affects multiple services, external contracts, database schema, authorization/tenancy/security, money/accounting/audit, asynchronous events/jobs, deployment/rollback, or other high-risk boundaries. For that check, confirm:

- every requirement item has an owning source or GAP;
- every known material cross-source boundary has both endpoints researched (evidence under both `sources/<id>` roots) or recorded as GAP;
- every changed data domain has an identified owner or GAP;
- every changed event has producer and relevant consumer coverage or GAP.

Full Closure is about **coverage of the requirement's material boundaries**, not about pre-excluding every registered source. Sources not touched by the requirement remain simply unmentioned.

## 6. Emit Initial Scope

Before deep research or delegation, state in `research-plan.md`:

- inventory source (`ba2md discover`, `ba2md status`, or `workspace.yaml` + listing);
- the starting source and why it is the most relevant;
- expected main path per source;
- known cross-source boundaries and endpoints (add more as research finds them);
- open ambiguities or GAPs;
- initial research units;
- whether ordinary Draft Readiness is enough or Full Closure is required.

This is a starting snapshot, not a frozen contract. Update it as selection grows.

## 7. Forbidden Discovery Anti-Patterns

Do **not**:

1. Use `grep`/`rg`/`Glob` on `sources/**` or `wiki/**` (or `sources/**/*.java`, `wiki/*.md`, etc.) as the way to **enumerate** projects or decide how many projects exist.
2. Treat a truncated workspace-wide search hit list as the full project set.
3. Conclude there is no wiki because `wiki/*.md` matched nothing while `wiki/<id>/` directories exist.
4. Use bare `wiki/` or `sources/` as a source root.
5. Pre-select or pre-exclude every managed source before research. Selection is progressive; "unmentioned" means "not yet evaluated", not "excluded".
6. Collapse multiple managed source ids into one selected source because the first search only returned files under one id.
7. Force a one-to-one wiki↔source mapping, or reject a source because no wiki entry describes it. Wiki coverage is optional.
8. Maintain a "selection must be closed" table and go back to edit prior exclusions whenever a new source is discovered — just research the new source and write its evidence.

## 8. Allowed Search Patterns After Inventory

After sources are chosen, searches must be rooted:

- Good: `rg -n 'RateLimiter' sources/billing-api`
- Good: `Glob sources/billing-api/**/*.java`
- Good: read `wiki/docs/billing-api/overview.md`
- Bad: `rg -n 'RateLimiter' sources`
- Bad: `Glob sources/**/*.java` then infer project count from hits
- Bad: `Glob wiki/*.md` as a wiki existence check
