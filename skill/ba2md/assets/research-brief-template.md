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

## Research Scope

- Trigger type: initial research / repair research
- Requirement files and R-* anchors:
- Source stage:
- Failed gate, if any:
- Source ID:
- Project role:
- Boundary ID and peer source, if applicable:
- Wiki pages (optional):
- Sources root:
- Related template sections and constraint files:
- Template relevance: RELEVANT / UNKNOWN
- Required inventory types and completeness criteria:
- Facts to verify:
- Boundary endpoints to verify:
- Newly discovered dependencies to report:
- Affected evidence / claim IDs:
- Affected or DIRTY sections:
- Out of scope:
- Precise identifiers that must not be guessed:

## Search Log

| Search ID | Root | Query / symbol / path | Result | Follow-up |
|-----------|------|-----------------------|--------|-----------|
| SR-001 | | | | |

## SUMMARY Findings

| Candidate ID | Claim | Wiki path | Relevance |
|--------------|-------|-----------|-----------|
| S-<WIKI>-001 | | | |

## Evidence Candidates

> A subagent may mark a FACT only as `FOUND`. The main agent must reopen its raw anchor before promoting it to `VERIFIED` in the authoritative registry.

| Candidate ID | Label | Status | Source type | Claim | Exact raw anchor | Symbol | Supported sections |
|--------------|-------|--------|-------------|-------|------------------|--------|--------------------|
| F-<SOURCE>-001 | FACT | FOUND | code/spec/standard/design/config/schema/deploy/alert | | `sources/<source-id>/...:1-10` | | |

## Implementation Inventory Results

| Item ID | Type | Source ID | Existing identifier | Requirement relevance | Evidence candidate | Draft section | Status / exclusion reason |
|---------|------|---------|---------------------|-----------------------|--------------------|---------------|---------------------------|
| | API/INTERNAL_INTERFACE/EVENT/ENTITY/JOB/PERMISSION/CONFIG/METRIC/ALERT/OTHER | | | | | | IN_SCOPE/EXCLUDED/GAP |

> Enumerate the complete in-scope set when the unit requires inventory completeness. For ordinary units, cover every load-bearing changed item and known material boundary; do not return misleading representative examples when exact coverage matters.

## Current Implementation

### Entry Points and Call Chain

| Step | Existing identifier | Behavior | Evidence candidate |
|------|---------------------|----------|--------------------|
| | | | |

### Contracts, Fields, and Errors

| Contract | Field / error | Type / optionality / default / constraint | Evidence candidate |
|----------|---------------|-------------------------------------------|--------------------|
| | | | |

### Data, Consistency, and Migration

### Authorization, Tenancy, and Sensitive Data

### Limits, Failure, and Recovery

### Observability, Alerts, Audit, and Deployment

## Cross-Source Boundary, if applicable

| Endpoint | Source ID | Direction / ownership | Current contract or behavior | Evidence candidate | Compatibility / failure responsibility |
|----------|---------|-----------------------|------------------------------|--------------------|----------------------------------------|
| Caller / producer / writer | | | | | |
| Provider / consumer / data owner | | | | | |

## Existing Seams and Alternatives

| Option | Existing seams examined | Change type | Benefit | Cost / risk | Evidence candidates |
|--------|-------------------------|-------------|---------|-------------|---------------------|
| | | REUSE/MODIFY/EXTEND/ADD/DEPRECATE/REMOVE | | | |

## Missing Material and Conflicts

| Candidate ID | Label | Critical | Description | Searches performed | Impact | Resolution / owner |
|--------------|-------|----------|-------------|--------------------|--------|--------------------|
| G-<FEATURE>-001 | GAP | Yes/No | | | | |

## Recommended Change

- Smallest coherent change:
- Existing seam to reuse or extend:
- Unavoidable new elements:
- Evidence that existing seams are insufficient:
- Compatibility, migration, and rollback impact:

## Main-Agent Acceptance

- Accepted evidence IDs:
- Rejected evidence IDs and reasons:
- Evidence promoted to VERIFIED:
- GAPs / CONFLICTs recorded:
- Newly discovered sources or boundaries:
- Active template / section-constraint updates:
- Implementation Inventory updates, at the task risk level:
- Selection, impact, and boundary updates:
- Follow-up or repair research units:
- Evidence-registry updates:
- Dirty sections:
- Resume stage:
