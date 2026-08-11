# Discovery Hardening Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Stop agents from mistaking multi-project ba2md workspaces for single-project (or empty-wiki) workspaces by hardening Skill discovery protocol, exposing machine-readable inventory via CLI, and validating registry coverage.

**Architecture:** Keep CLI as the workspace registry owner (`workspace.yaml`). Add a lightweight `ba2md discover` inventory that expands managed entries into logical projects (especially nested wiki). Force Skill Project Discovery to consume registry/discover output before any content search. Teach the Python validator to fail plans that ignore registered ids or use bare `wiki/`/`sources/` roots.

**Tech Stack:** TypeScript (Node 22+), Commander, existing Zod/YAML workspace config, Python3 validator, node:test.

## Global Constraints

- Do not change the multi-entry layout `sources/<id>/` and `wiki/<id>/`.
- Do not initialize workspace Git; do not write root `AGENTS.md`/`CLAUDE.md`.
- Discovery must stay shallow (one managed layer + one optional wiki project layer).
- CLI still does not call an LLM.

---

### Task 1: Skill protocol hardening

**Files:**
- Modify: `skill/ba2md/references/project-discovery.md`
- Modify: `skill/ba2md/SKILL.md`
- Modify: `skill/ba2md/references/research-protocol.md`
- Modify: `skill/ba2md/assets/research-brief-template.md`
- Modify: `skill/ba2md/assets/evidence-registry-template.md`

- [ ] Rewrite project-discovery with mandatory order, nested wiki rules, forbidden anti-patterns
- [ ] Point SKILL node 2 and research subagent instructions at registry/discover first
- [ ] Fix anchor examples to include `<id>` segments

### Task 2: `status --json` + `ba2md discover`

**Files:**
- Create: `src/diagnostics/discover.ts`
- Modify: `src/diagnostics/status.ts` (JSON formatter if needed)
- Modify: `src/cli.ts`
- Modify: `src/index.ts`
- Create: `src/tests/discover.test.ts`
- Modify: `src/tests/skill-and-doctor.test.ts`

- [ ] Implement collectDiscover / formatDiscover
- [ ] Wire CLI flags and export
- [ ] Tests for nested wiki, multi-source, orphans, JSON status

### Task 3: Validator registry checks

**Files:**
- Modify: `skill/ba2md/scripts/validate_artifacts.py`
- Create or extend tests via a small Python invocation in node test or manual script under `src/tests`

- [ ] Load workspace.yaml when present
- [ ] Require every registered source/wiki id in Candidate Impact Map (SELECT/EXCLUDE)
- [ ] Reject selected roots that are bare `wiki/` or `sources/`

### Task 4: Docs and verify

**Files:**
- Modify: `README.md`

- [ ] Document `status --json` and `discover`
- [ ] `npm test` passes
