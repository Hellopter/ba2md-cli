# Evidence Registry: <title>

## Requirement Inputs

| Requirement ID | Main/Supporting | Path | SHA-256 | Status | Selection basis |
|----------------|-----------------|------|---------|--------|-----------------|
| R-<REQ>-001 | Main | `requirements/...md` | | ACTIVE/STALE/SUPERSEDED | |

## Selected Sources (running note, derived from evidence)

> Optional. Append-only as research surfaces more sources. The set of in-scope sources is exactly the distinct `sources/<id>` roots in Evidence Records below — this table is a convenience summary, not a prerequisite for writing evidence.

| Source ID | Sources root | Wiki coverage | Roles | Selection basis | Responsibility scope |
|-----------|--------------|---------------|-------|-----------------|----------------------|
| | `sources/<id>` | `wiki/<id>` (optional) | | | |

## Evidence Records

> Scope ID = the source id for FACT records (`F-<SOURCE>-NNN`) or the wiki id for SUMMARY records (`S-<WIKI>-NNN`). Sources own facts; wiki owns summaries.

| Evidence ID | Label | Status | Scope ID | Claim | Source type | Exact anchor | Symbol | Supported sections | Verified by |
|-------------|-------|--------|----------|-------|-------------|--------------|--------|--------------------|-------------|
| R-<REQ>-001 | REQUIREMENT | VERIFIED/STALE/SUPERSEDED | - | | requirement | `requirements/...md:1-10` | | | |
| F-<SOURCE>-001 | FACT | FOUND/VERIFIED/REJECTED/STALE/SUPERSEDED | | | code/spec/standard/design/config/schema/deploy/alert | `sources/<source-id>/...:1-10` | | | |
| S-<WIKI>-001 | SUMMARY | VERIFIED | | | wiki | `wiki/<wiki-id>/...` or `wiki/<wiki-id>/<project>/...` | | | |

## Design Claims

| Claim ID | Label | Status | Claim | Basis Evidence IDs | Alternatives and rationale | Supported sections |
|----------|-------|--------|-------|--------------------|----------------------------|--------------------|
| P-<FEATURE>-001 | PROPOSAL | OPEN/ACCEPTED/REJECTED/SUPERSEDED | | | | |
| D-<FEATURE>-001 | DECISION | OPEN/ACCEPTED/SUPERSEDED | | | | |

## Issue Register

| Issue ID | Label | Critical | Status | Description | Evidence IDs | Impact | Validation or resolution | Owner | Supported sections |
|----------|-------|----------|--------|-------------|--------------|--------|--------------------------|-------|--------------------|
| G-<FEATURE>-001 | GAP | Yes/No | OPEN/RESOLVED/ACCEPTED | | | | | | |
| A-<FEATURE>-001 | ASSUMPTION | Yes/No | OPEN/VALIDATED/ACCEPTED/REJECTED | | | | | | |
| C-<FEATURE>-001 | CONFLICT | Yes/No | OPEN/RESOLVED/ACCEPTED | | | | | | |

## Current-to-Target Decisions

| Design item | Current FACT IDs | Requirement delta | Decision ID | Change type | Existing seam | ADD insufficiency evidence | Affected sections |
|-------------|------------------|-------------------|-------------|-------------|---------------|----------------------------|-------------------|
| | | | | REUSE/MODIFY/EXTEND/ADD/DEPRECATE/REMOVE | | | |

## Decision Map

| Decision ID | Question ID | Status | User choice or change | Recommended option | Decision rationale | Basis Evidence IDs | Affected sections | Needs new research | Return node | Confirmed by |
|-------------|-------------|--------|-----------------------|--------------------|--------------------|--------------------|-------------------|--------------------|--------------|--------------|
| D-<FEATURE>-001 | Q-<FEATURE>-001 or FREEFORM | OPEN/ENGAGED/ACCEPTED/DEFERRED/SUPERSEDED | | | | | | Yes/No | Requirement Intake/Project Discovery/Research/Evidence Reconcile/Draft Writing | |

## Coverage Summary

| Metric | Result |
|--------|--------|
| Selected sources | |
| Draft Readiness passed | |
| Full Closure required / passed | |
| Known cross-source boundaries verified/GAPed | |
| Accepted research briefs | |
| VERIFIED FACTs | |
| PROPOSALs / DECISIONs | |
| Open ASSUMPTIONs | |
| Open GAPs | |
| Open CONFLICTs | |
| Unconfirmed critical user questions | |
| Precise current-identifier coverage | |
| ADD insufficiency-analysis coverage | |
