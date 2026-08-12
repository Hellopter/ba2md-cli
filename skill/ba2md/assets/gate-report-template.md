# Quality Gate Report: <title>

> Mechanical PASS never authorizes Draft Review handoff.
> Handoff requires Content Review result in {PASS, PASS_WITH_DISCUSSION, BLOCKED}.
> RESEARCH_REQUIRED / REVISION_REQUIRED / RECONCILE_REQUIRED must loop, not hand off.

- Run date:
- Mode: draft / final
- Gate level: mechanical / local-content / full-content
- Overall result: PASS / PASS_WITH_DISCUSSION / RESEARCH_REQUIRED / REVISION_REQUIRED / RECONCILE_REQUIRED / BLOCKED
- content_review_round:
- repair_rounds_by_finding_cluster:
- Current node:
- Resume node:
- Ready for Draft Review handoff: Yes/No

## 1. Mechanical Precheck (subordinate)

> Subordinate only. A mechanical PASS does **not** authorize user-led Draft Review.

Script: `scripts/validate_artifacts.py` (or equivalent local fixes summary)

| Check | Result | Details |
|-------|--------|---------|
| Artifact and ID integrity | | |
| Required process tables present | | |
| Raw-anchor existence | | |
| FACT verification status | | |
| Java-test exclusion | | |
| Placeholder scan | | |
| ADD insufficiency field | | |
| Critical-question and decision status | | |

- Mechanical overall: PASS / FAIL
- Local mechanical fixes applied this round:

## 2. Content Review (primary)

> Primary Quality Gate. Must run on every readable draft. Findings-only; reviewers do not edit the draft or promote FACTs.

- Content Review result: PASS / PASS_WITH_DISCUSSION / RESEARCH_REQUIRED / REVISION_REQUIRED / RECONCILE_REQUIRED / BLOCKED
- Reviewer mode: default (1 comprehensive) / high-risk (up to 3 lenses)
- Review report path(s): `reviews/content-review-<round>-<lens>.md`

### Content Review Findings

| Finding ID | Type | Severity | Problem | Basis | Affected sections | Needs user | Recommended return node | Status |
|------------|------|----------|---------|-------|-------------------|------------|-------------------------|--------|
| GF-001 | MECHANICAL/WRITING/EVIDENCE/CONFLICT/SCOPING/DECISION/CRITICAL_GAP | Critical/High/Medium/Low | | | | Yes/No | | OPEN/RESOLVED |

### Must-fix before user handoff

- ...

## 3. Dirty Sections

| Section | Trigger | Dependent evidence / claim / decision IDs | Required action | Status |
|---------|---------|-------------------------------------------|-----------------|--------|
| | | | | DIRTY/CLEARED |

## 4. Routing Decision

- Next node:
- Repair research units:
- Sections to rewrite:
- Discussion required:
- Required next gate level:
- Reason if full content review is required:
- Loop action: re-precheck / rewrite / repair-research / reconcile / rediscover / handoff / handoff-blocked

## 5. Critical Backlog for User-Led Review

> List load-bearing user-decidable items discovered while drafting/gating. Present this table as a menu in Draft Review; do not auto-open the first row as a popup. Missing implementation facts do not belong here — record them as GAPs. Status values: OPEN / ENGAGED / ACCEPTED / DEFERRED / SUPERSEDED.
> Include this backlog in the handoff package only when Ready for Draft Review handoff is Yes.

| Question ID | Question | Known facts or gaps | Recommended option and rationale | Other options | Impact | Status |
|-------------|----------|---------------------|----------------------------------|---------------|--------|--------|
| Q-<FEATURE>-001 | | | | | | OPEN |

## 6. Evidence Quality Summary

| Metric | Result |
|--------|--------|
| Requirement anchors recorded | |
| Source selection justified | |
| Draft Readiness passed | |
| Full Closure required | Yes/No |
| Full Closure passed, if required | |
| Active template sections handled | |
| Inventory coverage appropriate to risk | |
| Inventory-to-draft traceability | |
| Irrelevant sections not populated | |
| Requirement-to-source coverage | |
| Known cross-source boundaries verified/GAPed | |
| Strong exclusions justified, if applicable | |
| Accepted research briefs | |
| VERIFIED FACTs | |
| Precise-identifier coverage | |
| ADD insufficiency coverage | |
| Open critical GAPs / CONFLICTs | |
| Unconfirmed critical user questions | |
| Content Review completed this gate | Yes/No |
| User-led review handoff authorized | Yes/No |
| User-engaged decisions recorded | |

## 7. Draft Review Handoff Summary

- Draft path:
- Recommended design direction:
- Key design decisions:
- Critical backlog presented (not auto-asked):
- Changes from previous version:
- Resolved issues:
- Remaining non-critical GAPs:
- Blocker package attached (when BLOCKED):
- Floor handed to user / awaiting user lead:
- Ready as a final candidate only after explicit user confirmation:
