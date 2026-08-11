# Project Discovery and One-to-One Pairing

Use this phase to select project scope, not to perform deep implementation research. Prefer the smallest set that covers the requirement and known material boundaries.

**Hard rule:** finish the inventory and pairing tables before any workspace-wide content search. Content search may only run inside an already-identified pair root.

## 0. Mandatory Inventory Order

Do these steps in order. Do not skip ahead to `grep`, `Glob`, or symbol search.

1. **Read the workspace registry.** Prefer, in order:
   - `ba2md discover --json` (best: managed entries + logical projects);
   - else `ba2md status --json`;
   - else read `{WORKSPACE}/workspace.yaml` and list one level of `{WORKSPACE}/sources/` and `{WORKSPACE}/wiki/`.
2. **Record every managed entry** under `sources.<id>` and `wiki.<id>`. Treat the registry as a **lower bound**, not a hint. An id that exists in the registry is a real project entry even if a later content search never returns files from it.
3. **Reconcile disk vs registry.** List immediate children of `sources/` and `wiki/` only (depth 1). Match names to registry ids. Record missing paths as broken; record unregistered directories as orphans to evaluate, not to ignore silently.
4. **Expand logical projects** (section 1) before reading wiki pages in depth.
5. **Write the Candidate Project Impact Map** with every managed source id and every logical wiki project represented as `select` or `exclude` plus reason.
6. **Only then** may content search run, and only under a concrete pair root such as `sources/<source-id>/` or `wiki/<wiki-id>/` or `wiki/<wiki-id>/<project>/`.

If the CLI is unavailable, perform the same steps with `workspace.yaml` + directory listing. Never invent a single-project workspace when the registry lists multiple ids.

## 1. Locate Roots and Expand Logical Projects

Prefer `{WORKSPACE}/wiki/` and `{WORKSPACE}/sources/`. If `sources/` is absent and `souces/` exists, use `souces/` and record that spelling in process artifacts.

### Managed entry vs logical project

| Layer | Path shape | Meaning |
|-------|------------|---------|
| Collection root | `sources/`, `wiki/` | Not a project. Never use as a pair root or search root by itself. |
| Managed entry | `sources/<id>/`, `wiki/<id>/` | One CLI-registered resource from `workspace.yaml`. |
| Logical project | managed entry root, or one child under a nested wiki entry | Pairable unit that may own requirement behavior. |

### Sources expansion

Each readable `sources/<id>/` is normally **one** logical sources project. Record:

- managed id and path `sources/<id>`;
- identity signals: root `README*`, build manifests (`pom.xml`, `build.gradle*`, `package.json`, `go.mod`, `Cargo.toml`, `*.sln`, `*.csproj`), service name, top-level package/module dirs;
- whether the tree looks like a monorepo (multiple deployable modules). Still keep **one pair row per managed id** unless the requirement clearly targets separable repos that were incorrectly bundled; do not collapse multiple managed ids into one pair.

### Wiki expansion (nested-layout rule)

For each readable `wiki/<id>/`:

1. If the entry root itself has overview/index material (`index.md`, `README.md`, `overview*`, `introduction*`, `architecture*`, nav index), treat the **entry root** as one logical wiki project at `wiki/<id>`.
2. Else if the entry root has **no** such entry pages, but one or more **immediate child directories** do, treat **each child** as a logical wiki project at `wiki/<id>/<child>/`. This is the common “docs monorepo” layout.
3. Else if both the root and some children look like projects, prefer the root as the primary project and list strong child areas as modules or additional candidates with explicit reasons.
4. Never conclude “no wiki” because `wiki/*.md` is empty. Managed wiki entries are often directories whose Markdown lives one level deeper.

A collection root may itself be one project only when it is **not** using the managed multi-entry layout (no `workspace.yaml` ids) and it contains overview/index material plus source-manifest characteristics. In a normal ba2md workspace, always go through managed ids.

### Lightweight index fields

Build a lightweight index without loading every page in full. Capture:

- managed id, logical project path, and likely identity;
- title/frontmatter and H1/H2 headings on entry pages only;
- locations of `index.md`, `README.md`, `overview*`, `introduction*`, `architecture*`, system-context, and domain-index pages;
- links or names that suggest upstream/downstream systems;
- likely matching sources directory / managed source id;
- requirement keyword, title, alias, and domain-term matches.

## 2. Read Plausible Wiki Entry Pages

Read entry material for plausible wiki projects, not every project by default. A project is plausible when any of these apply:

- its name, title, headings, aliases, or domain terms match the requirement;
- it is linked from a plausible owner project;
- it may own an upstream/downstream boundary, data domain, event producer/consumer, authorization rule, scheduled job, frontend, deployment, alert, or operations responsibility;
- source reconnaissance later points back to it;
- it is the only registered wiki/source pair (still record the pair proof).

For each plausible wiki project, inspect in this order when present:

1. root `index.md`, `README.md`, or navigation index;
2. primary `overview*`, `introduction*`, `architecture*`, system-context, or domain-index pages;
3. pages whose titles or index descriptions match requirement signals;
4. pages linked as contract, event, data, authorization, deployment, or operations dependencies.

For small workspaces, scanning every wiki project's entry pages is acceptable. For large workspaces, expand beyond plausible projects only when ownership or a material boundary remains unresolved. **Small vs large does not waive the inventory of managed ids.**

Capture only:

- project purpose, ownership, and boundaries;
- domain vocabulary and aliases;
- major modules or bounded contexts;
- upstream/downstream systems;
- APIs, events, jobs, or data domains that may form boundaries;
- likely source repository or package names;
- requirement matches, mismatches, and unresolved ownership.

Use wiki only for SUMMARY records and search hypotheses. Do not treat class names, fields, routes, schemas, configuration, or operational claims copied from wiki as exact FACTs.

## 3. Pair Wiki and Sources One-to-One

Build a pairing table:

| Pair ID | Wiki project | Sources project | Pair proof | Requirement match | Candidate role | Decision |
|---------|--------------|-----------------|------------|-------------------|----------------|----------|
| | | | | strong/medium/weak | owner/boundary/data/event/auth/job/ops/near-match | select/exclude |

Pair paths must be concrete managed or logical roots, for example:

- wiki: `wiki/docs` or `wiki/docs/billing-service`
- sources: `sources/billing-service`

Never write bare `wiki/` or `sources/` as a pair root.

Pairing heuristics, in order:

1. explicit repository/source link in wiki metadata;
2. exact directory name equality between logical wiki project and managed source id;
3. normalized name after stripping suffixes such as `-wiki`, `_wiki`, `.wiki`;
4. matching package/service identity in README, build manifest, deployment metadata, or source root;
5. matching domain ownership and integration names.

Require at least one proof stronger than a keyword coincidence. Never pair one wiki project directly to several Sources projects. If a wiki describes a system made of several repositories, represent each repository as a separate pair or mark it as an explicit integration dependency.

### Registry coverage (required)

Before freezing scope:

- every `workspace.yaml` `sources.<id>` appears in the Candidate Project Impact Map as `select` or `exclude` with a concrete reason;
- every logical wiki project from section 1 appears the same way;
- if multiple source ids exist and only one is selected, the others must be explicitly excluded — silence is invalid and usually means discovery truncated.

## 4. Perform Shallow Source Reconnaissance

Before freezing scope, inspect only identity and likely seams for selected or strongly plausible pairs **inside each pair's sources root**:

- build manifests and service identity;
- root package/module layout and startup entry points;
- router/controller locations;
- domain modules and public interfaces;
- DTO/schema/proto locations;
- migration/schema directories;
- message, event, and scheduled-job definitions;
- configuration, deployment, and observability directories.

Use this pass to confirm pair proof, locate likely main paths, and detect dependencies omitted or outdated in wiki. Do not perform exhaustive implementation analysis here.

If reconnaissance reveals an unaccounted material project, return it to plausible wiki reading and pairing. Source evidence may expand or correct wiki-derived scope.

## 5. Select the Minimal Covering Set

Rank projects by:

- direct ownership of the behavior;
- presence of requirement vocabulary in entry pages;
- presence of current implementation anchors;
- upstream/downstream relevance;
- data/event/authorization/job/operations ownership;
- evidence recency when known.

Select one or more pairs only when each contributes a distinct part of the requirement or a material boundary that may be affected. Record rejected near-matches to prevent later accidental evidence mixing.

A normal task may begin deep research once the selected owner pair(s), known material boundaries, and unresolved GAPs are recorded. Do not force a workspace-wide closure pass unless the change is high-risk or the user requests complete impact analysis.

Use a Full Closure Check only when the change affects multiple services, external contracts, database schema, authorization/tenancy/security, money/accounting/audit, asynchronous events/jobs, deployment/rollback, or other high-risk boundaries. For that check, confirm:

- every requirement item has an owning pair or GAP;
- every known material cross-project boundary has both endpoints selected, explicitly excluded with evidence, or recorded as GAP;
- every changed data domain has an identified owner or GAP;
- every changed event has producer and relevant consumer coverage or GAP;
- every strong candidate is selected or has a concrete exclusion reason;
- every registered managed source id and logical wiki project is selected or explicitly excluded.

## 6. Emit Initial Scope

Before deep research or delegation, state in `research-plan.md`:

- inventory source (`ba2md discover`, `ba2md status`, or `workspace.yaml` + listing);
- selected pairs and why;
- rejected near-matches and why;
- explicit exclusions for other registered ids;
- expected main path per pair;
- known cross-project boundaries and endpoints;
- open ambiguities or GAPs;
- initial research units;
- whether ordinary Draft Readiness is enough or Full Closure is required.

## 7. Forbidden Discovery Anti-Patterns

Do **not**:

1. Use `grep`/`rg`/`Glob` on `sources/**` or `wiki/**` (or `sources/**/*.java`, `wiki/*.md`, etc.) as the way to **enumerate** projects or decide how many projects exist.
2. Treat a truncated workspace-wide search hit list as the full project set.
3. Conclude there is no wiki because `wiki/*.md` matched nothing while `wiki/<id>/` directories exist.
4. Use bare `wiki/` or `sources/` as a Selected Project Pair root.
5. Enter Research, write briefs, or draft implementation claims before the Candidate Project Impact Map covers every managed source id and every logical wiki project.
6. Collapse multiple managed source ids into one pair because the first search only returned files under one id.
7. Ask the user “which single repo?” when `workspace.yaml` already lists multiple sources without first presenting the inventory and a recommended covering set.

## 8. Allowed Search Patterns After Inventory

After pairs are chosen, searches must be rooted:

- Good: `rg -n 'RateLimiter' sources/billing-api`
- Good: `Glob sources/billing-api/**/*.java`
- Good: read `wiki/docs/billing-api/overview.md`
- Bad: `rg -n 'RateLimiter' sources`
- Bad: `Glob sources/**/*.java` then infer project count from hits
- Bad: `Glob wiki/*.md` as a wiki existence check
