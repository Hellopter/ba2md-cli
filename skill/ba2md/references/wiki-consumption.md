# Consuming the Wiki

The wiki is a **discovery and positioning digest** that spans the source corpus: identities, ownership, boundaries, terminology, and how modules relate. Reading it well is the cheapest way to understand the system and to lock down which part of `sources/` a requirement actually touches — far cheaper than discovering the same facts by reading code.

This reference is about **how to read** the wiki, not what to select. Selection, inventory order, and forbidden anti-patterns live in `references/project-discovery.md`; this file assumes you already know where the wiki is (from `ba2md discover --json` / `workspace.yaml`).

## Why the wiki pays off

Source code tells you *how* something is implemented right now; the wiki tells you *why it exists, who owns it, and what touches what*. A focused wiki read before deep source research means:

- your source investigation starts from the right module, not from a guess;
- you already know the module's boundaries, upstream/downstream neighbors, and domain vocabulary;
- you can tell when a requirement crosses a boundary (and therefore which *other* sources to expect) before you trip over it in code.

Skipping the wiki to save time almost always costs more time later — you end up reverse-engineering ownership and boundaries from imports and call sites that the wiki already states. Treat the wiki read as an investment that narrows and de-risks everything downstream, not as an optional skim.

## Structure of a wiki entry

A managed wiki entry lives at `wiki/<id>/`. It may be one logical project at the root, or a "docs monorepo" where each immediate child directory is its own project (`wiki/<id>/<child>/`). `ba2md discover --json` reports this shape and lists entry pages per logical project — read that first so you know the layout before opening any page.

Pages fall into three roles. Recognizing the role tells you how much to read:

| Role | Typical filenames | Job |
|------|-------------------|-----|
| Navigation | `index.md`, `README.md`, nav indexes | Route you to the right place. **Skim, don't study** — read headings and links, not the prose. |
| Total view | `overview.md`, `overview*`, `introduction*`, `architecture.md`, `architecture*`, system-context, domain-index | Describe a whole project or module: purpose, boundaries, ownership, major components, dependencies. **Read these fully.** This is where the system's mental model lives. |
| Detail / dependency | everything else: contract pages, event/data/authorization/deployment/ops pages, module internals | Cover a specific concern. **Read on demand**, when a requirement signal or a total-view link points at them. |

The reading depth you bring to a page depends on its role, not on how long it is. A 3-line navigation `index.md` is skimmed for links; an `architecture.md` is read end to end even if it is long, because every paragraph is positioning you for later source work.

## Reading depth tiers

Read deliberately, in proportion to a page's role. There is no flat "read everything once."

1. **Skim for navigation** — root `index.md`, module `index.md`, `README.md`. Goal: learn what modules exist and where each lives. Capture the module list and the links you will need. Do not absorb prose.
2. **Read fully for a mental model** — `overview.md` (project total view) and each relevant module's `architecture.md` / `architecture*`. Goal: build the model the rest of your work will sit inside — what the module is for, what it owns, its major components, its upstream/downstream neighbors, its domain terms. Read these **in full**, not as a signal scan. This tier is the entire point of consuming the wiki; under-reading here is the failure mode that makes the wiki feel useless.
3. **Read on demand** — contract, event, data-domain, authorization, deployment, operations, and module-internal pages. Goal: answer a specific question raised by the requirement or by a total-view page. Open these only when a signal points at them, and read only what the question needs.

A reasonable default for an unfamiliar workspace: skim every navigation page (tier 1) so you have the full module map, read every project/module total-view page that could possibly relate to the requirement (tier 2), then pull detail pages (tier 3) as specific questions arise. For a small workspace it is fine to read all total-view pages up front.

## Two consumption modes

How much wiki you read depends on what you are doing.

- **Understand / lock-scope mode** — the goal is to understand the system and pin down which modules and boundaries a requirement touches, *before* committing to deep source research. This is mostly tiers 1–2: skim the navigation to map modules, then read the relevant total-view pages in full to lock ownership and boundaries. You are building a scope hypothesis and a search strategy, not collecting citable evidence yet. This is the mode to default to at Project Discovery.
- **Evidence-collection mode** — the goal is to back a specific claim in the design doc. Wiki material here is supporting context (terminology, ownership, boundary framing) while the *proving* FACTs come from `sources/<id>/`. Open detail pages (tier 3) as the claim demands.

Most real work blends the two: understand first, then collect evidence. Don't collapse them — locking scope is a distinct, earlier step from proving facts.

## Trust boundary: reading deeply ≠ citing as fact

The wiki is `SUMMARY` material, and the rule that wiki content cannot independently prove precise implementation is real and important — but it governs **citation**, not **reading**. These are separate concerns and must not collapse:

- You may — and should — read `overview.md` and `architecture.md` **in full** to build your understanding of the system. That is never a trust violation.
- When you write a precise claim into a process artifact or the SDD (a class name, field, route, schema, configuration, or operational behavior), wiki text alone is not enough: record it as a `SUMMARY` unless you have anchored it to `sources/<id>` as a `FACT`.

In short: **read the wiki as your map; cite it as a summary.** The fact that a claim must be verified against source before it becomes `FACT` is the gate on evidence quality (see `references/evidence-quality.md`) — it is not a reason to skim the map. Reading the map carefully is exactly what tells you where to dig in source.

## Reading order at a glance

For each wiki project that a requirement plausibly touches, when the pages are present:

1. skim the root `index.md` / navigation → know the module map;
2. read `overview.md` (project total view) in full → build the system model;
3. skim the relevant module `index.md` → locate the module's pages;
4. read that module's `architecture.md` in full → learn its boundaries, ownership, and dependencies;
5. pull detail pages (contract / event / data / authorization / deployment / ops) on demand → answer specific questions;
6. stop when you can state, in your own words, which modules and boundaries the requirement touches and why — that is the signal the wiki read is done and you are ready to select sources and research.

When a page the order expects is absent, treat the gap as a discovery note, not a blocker: read what exists, record what is missing.

## When you can stop reading

You have consumed enough wiki when you can confidently answer:

- which module(s) own the behavior the requirement describes;
- which boundaries the change crosses (and therefore which other sources may enter scope);
- what domain vocabulary and aliases to search for in `sources/`;
- what is *not* covered by the wiki (record these as discovery GAPs).

If you cannot answer the first bullet, you have not read enough — go back to the total-view tier. If you can answer all four, the wiki has done its job and further reading has diminishing returns: move to source research.
