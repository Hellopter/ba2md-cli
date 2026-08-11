# Project Discovery and One-to-One Pairing

Use this phase to select project scope, not to perform deep implementation research. Prefer the smallest set that covers the requirement and known material boundaries.

## 1. Locate Roots and Build a Lightweight Index

Prefer `{WORKSPACE}/wiki/` and `{WORKSPACE}/sources/`. If `sources/` is absent and `souces/` exists, use `souces/` and record that spelling in process artifacts.

Enumerate immediate project directories under both roots. A root may itself be one project only when it contains overview/index material plus source-manifest characteristics.

Build a lightweight index without loading every page in full. Capture:

- project directory and likely identity;
- title/frontmatter and H1/H2 headings;
- locations of `index.md`, `README.md`, `overview*`, `introduction*`, `architecture*`, system-context, and domain-index pages;
- links or names that suggest upstream/downstream systems;
- likely matching Sources directory;
- requirement keyword, title, alias, and domain-term matches.

## 2. Read Plausible Wiki Entry Pages

Read entry material for plausible wiki projects, not every project by default. A project is plausible when any of these apply:

- its name, title, headings, aliases, or domain terms match the requirement;
- it is linked from a plausible owner project;
- it may own an upstream/downstream boundary, data domain, event producer/consumer, authorization rule, scheduled job, frontend, deployment, alert, or operations responsibility;
- source reconnaissance later points back to it.

For each plausible wiki project, inspect in this order when present:

1. root `index.md`, `README.md`, or navigation index;
2. primary `overview*`, `introduction*`, `architecture*`, system-context, or domain-index pages;
3. pages whose titles or index descriptions match requirement signals;
4. pages linked as contract, event, data, authorization, deployment, or operations dependencies.

For small workspaces, scanning every wiki project's entry pages is acceptable. For large workspaces, expand beyond plausible projects only when ownership or a material boundary remains unresolved.

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

Pairing heuristics, in order:

1. explicit repository/source link in wiki metadata;
2. exact directory name;
3. normalized name after stripping suffixes such as `-wiki`, `_wiki`, `.wiki`;
4. matching package/service identity in README, build manifest, deployment metadata, or source root;
5. matching domain ownership and integration names.

Require at least one proof stronger than a keyword coincidence. Never pair one wiki project directly to several Sources projects. If a wiki describes a system made of several repositories, represent each repository as a separate pair or mark it as an explicit integration dependency.

## 4. Perform Shallow Source Reconnaissance

Before freezing scope, inspect only identity and likely seams for selected or strongly plausible pairs:

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
- every strong candidate is selected or has a concrete exclusion reason.

## 6. Emit Initial Scope

Before deep research or delegation, state in `research-plan.md`:

- selected pairs and why;
- rejected near-matches and why;
- expected main path per pair;
- known cross-project boundaries and endpoints;
- open ambiguities or GAPs;
- initial research units;
- whether ordinary Draft Readiness is enough or Full Closure is required.
