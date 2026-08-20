# 研究 Brief：<unit-id>

## Unit Contract（调研前冻结；写 brief 的子代理不得改）

| 字段 | 值 |
|------|----|
| Unit ID | |
| Trigger | initial / repair |
| Source ID 或边界 ID | |
| 源码根（具体） | `sources/<id>/...` |
| 允许的 wiki 页（可选） | |
| 需求摘录 | |
| 问题（有界） | |
| 期望事实类型 | FACT / GAP / CONFLICT 候选 |
| 范围外 | |
| 不得猜测 | 精确 API 路径、字段名、符号、阈值、类名 |
| 输出路径 | `briefs/<unit-id>.md` |
| 完成当 | Evidence Candidates 表已填，或有界否定 GAP 且有 Search Log |

## Search Log

| Search ID | Root | 查询 / 符号 / 路径 | 结果 | 后续 |
|-----------|------|-------------------|------|------|
| SR-001 | | | | |

## Evidence Candidates

> Brief 是调研笔记。候选只标 `FOUND`。写 draft 时主会话重开原文，把锚点写进稿。不要另建证据登记册。

| Candidate ID | Label | Status | Source type | Claim | 精确原文锚点 | Symbol | 支撑的节 |
|--------------|-------|--------|-------------|-------|--------------|--------|----------|
| F-<SOURCE>-001 | FACT | FOUND | code/spec/standard/design/config/schema/deploy/alert | | `sources/<source-id>/...:1-10` | | |

## Missing Material and Conflicts

| Candidate ID | Label | Critical | 说明 | 已做搜索 | 影响 |
|--------------|-------|----------|------|----------|------|
| G-<FEATURE>-001 | GAP | Yes/No | | | |
