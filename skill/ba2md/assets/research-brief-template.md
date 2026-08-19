# Research Brief: <unit-id>

## Unit Contract (frozen before research; subagent must not edit)

| Field | Value |
|-------|-------|
| Unit ID | |
| Trigger | initial / repair |
| Source ID or Boundary ID | |
| Sources root (concrete) | `sources/<id>/...` |
| Wiki pages allowed (optional) | |
| Requirement excerpts / R-* IDs | |
| Questions (bounded) | |
| Expected fact types | FACT / GAP / CONFLICT only as candidates |
| Out of scope | |
| Must not guess | exact API paths, field names, symbols, thresholds, class names |
| Output path | `briefs/<unit-id>.md` |
| Done when | Evidence Candidates table filled OR bounded negative GAP with Search Log |

## Search Log

| Search ID | Root | Query / symbol / path | Result | Follow-up |
|-----------|------|-----------------------|--------|-----------|
| SR-001 | | | | |

## SUMMARY Findings

| Candidate ID | Claim | Wiki path | Relevance |
|--------------|-------|-----------|-----------|
| S-<WIKI>-001 | | | |

## Evidence Candidates

> A subagent may mark a FACT only as `FOUND`. The main agent must reopen its raw anchor before promoting it to `VERIFIED` in the registry.

| Candidate ID | Label | Status | Source type | Claim | Exact raw anchor | Symbol | Supported sections |
|--------------|-------|--------|-------------|-------|------------------|--------|--------------------|
| F-<SOURCE>-001 | FACT | FOUND | code/spec/standard/design/config/schema/deploy/alert | | `sources/<source-id>/...:1-10` | | |

## Missing Material and Conflicts

| Candidate ID | Label | Critical | Description | Searches performed | Impact | Resolution / owner |
|--------------|-------|----------|-------------|--------------------|--------|--------------------|
| G-<FEATURE>-001 | GAP | Yes/No | | | | |

## Recommended Change

- Smallest coherent change:
- Existing seam to reuse or extend:
- Unavoidable new elements (ADD requires inspected seams + insufficiency):
- Compatibility, migration, and rollback:

## Main-Agent Acceptance

- Accepted / rejected candidate IDs:
- Promoted to VERIFIED:
- Newly discovered sources or boundaries:
- Follow-up or repair units:
- Dirty sections:
