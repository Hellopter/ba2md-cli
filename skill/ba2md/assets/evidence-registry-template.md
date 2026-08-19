# 证据登记册：<title>

## Requirement Inputs

| Requirement ID | Main/Supporting | Path | SHA-256 | Status | 选择依据 |
|----------------|-----------------|------|---------|--------|----------|
| R-<REQ>-001 | Main | `requirements/...md` | | ACTIVE/STALE/SUPERSEDED | |

## Selected Sources（随证据追加的流水账）

> 可选。调研露出更多源时只追加。范围内的源 = 下面 Evidence Records 里出现过的不同 `sources/<id>` 根 — 本表是摘要，不是写证据的前提。

| Source ID | Sources root | Wiki coverage | Roles | 选择依据 | 职责范围 |
|-----------|--------------|---------------|-------|----------|----------|
| | `sources/<id>` | `wiki/<id>`（可选） | | | |

## Evidence Records

> Scope ID = FACT 的 source id（`F-<SOURCE>-NNN`）或 SUMMARY 的 wiki id（`S-<WIKI>-NNN`）。源码拥有事实；wiki 拥有摘要。

| Evidence ID | Label | Status | Scope ID | Claim | Source type | Exact anchor | Symbol | 支撑的节 | Verified by |
|-------------|-------|--------|----------|-------|-------------|--------------|--------|----------|-------------|
| R-<REQ>-001 | REQUIREMENT | VERIFIED/STALE/SUPERSEDED | - | | requirement | `requirements/...md:1-10` | | | |
| F-<SOURCE>-001 | FACT | FOUND/VERIFIED/REJECTED/STALE/SUPERSEDED | | | code/spec/standard/design/config/schema/deploy/alert | `sources/<source-id>/...:1-10` | | | |
| S-<WIKI>-001 | SUMMARY | VERIFIED | | | wiki | `wiki/<wiki-id>/...` | | | |

## Design Claims

| Claim ID | Label | Status | Claim | Basis Evidence IDs | 备选与理由 | 支撑的节 |
|----------|-------|--------|-------|--------------------|------------|----------|
| P-<FEATURE>-001 | PROPOSAL | OPEN/ACCEPTED/REJECTED/SUPERSEDED | | | | |
| D-<FEATURE>-001 | DECISION | OPEN/ACCEPTED/SUPERSEDED | | | | |

## Issue Register

| Issue ID | Label | Critical | Status | 说明 | Evidence IDs | 影响 | 核验或处理 | Owner | 支撑的节 |
|----------|-------|----------|--------|------|--------------|------|------------|-------|----------|
| G-<FEATURE>-001 | GAP | Yes/No | OPEN/RESOLVED/ACCEPTED | | | | | | |
| A-<FEATURE>-001 | ASSUMPTION | Yes/No | OPEN/VALIDATED/ACCEPTED/REJECTED | | | | | | |
| C-<FEATURE>-001 | CONFLICT | Yes/No | OPEN/RESOLVED/ACCEPTED | | | | | | |

## Current-to-Target Decisions

| Design item | Current FACT IDs | Requirement delta | Decision ID | Change type | Existing seam | ADD 不足证据 | 受影响节 |
|-------------|------------------|-------------------|-------------|-------------|---------------|--------------|----------|
| | | | | REUSE/MODIFY/EXTEND/ADD/DEPRECATE/REMOVE | | | |

## Decision Map

| Decision ID | Question ID | Status | 用户选择或变更 | 推荐项 | 决策理由 | Basis Evidence IDs | 受影响节 | 要新调研 | 返回节点 | Confirmed by |
|-------------|-------------|--------|----------------|--------|----------|--------------------|----------|----------|----------|--------------|
| D-<FEATURE>-001 | Q-<FEATURE>-001 or FREEFORM | OPEN/ENGAGED/ACCEPTED/DEFERRED/SUPERSEDED | | | | | | Yes/No | Requirement Intake/Wiki/Research/Evidence Reconcile/Draft Writing | |

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
