# Load-bearing questions (SDD)

Load when building or filtering the grill backlog, or when judging whether a user concern should enter grilling.  
Path: `{SKILL_DIR}/references/load-bearing.md` — inside this skill bundle, **not** under `{WORKSPACE}`.

A question is **load-bearing** only if a wrong answer causes *directional* rework: architecture shape, major integration, material data model, permission/security boundary, primary technical path, compatibility/migration that blocks ship, hard NFR bar, or user **taste** that reverses a visible product/tech call.

## Ask / keep on the grill backlog

- Goals / non-goals / priority that changes design scope
- Architecture or major integration shape
- Entities, ownership, lifecycle that change the model or storage
- Trust, authz, multi-tenant, or data-sensitivity boundaries
- The happy technical path that defines the design
- Migration / compatibility / rollout that can block release
- Contractual, regulatory, or hard performance/reliability bars
- Explicit taste calls (what “good” looks like for this design surface)
- Choice among already researched viable designs (`REUSE` / `MODIFY` / `EXTEND` / `ADD` forks)

## Do not ask / drop from the grill backlog

- Naming, copy polish, routine errors, ordinary logging
- Anything findable in `wiki/`, `sources/`, briefs, registry, tests, or conventions
- UI tweaks that do not change architecture or the main technical path
- Implementation trivia that does not move scope, acceptance, or the recommended design
- Low-stakes defaults where a conservative choice is fine
- Factual GAPs that need corpus/research, not a product decision

## Grill backlog shape

- Start with 3–7 draft-cited items; cite section / design item / open risk
- Prefer user-engaged topics over agent-only curiosity
- One live question per turn; recommended answer when useful
- Decision log only during Q&A (no final file; no full draft rewrite mid-grill)
- End: backlog empty, or user stops and leftovers become **仍生效假设**
- Parent then routes resolutions → rewrite/gate → Draft Review handoff again
