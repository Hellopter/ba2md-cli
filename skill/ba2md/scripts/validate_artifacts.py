#!/usr/bin/env python3
"""Lightweight validation for ba2md evidence and deliverables without hardcoded template sections."""

import argparse
import re
import sys
from pathlib import Path


ID_RE = re.compile(r"\b([RFSPDACGQ]-[A-Z0-9][A-Z0-9-]*-\d{3})\b")
ANCHOR_RE = re.compile(r"`?([^`|]+?):(\d+)(?:-(\d+))?`?")
PLACEHOLDER_RE = re.compile(r"TODO|TBD|<design-title>|<feature-name>|<one-line|YYYY-MM-DD|<optional>", re.IGNORECASE)
BARE_COLLECTION_ROOT_RE = re.compile(r"^(?:\.?/)?(?:sources|wiki|souces)/?$", re.IGNORECASE)
MANAGED_SOURCE_PATH_RE = re.compile(r"(?:^|[\s`])((?:sources|souces)/([^/`\s|]+))", re.IGNORECASE)
MANAGED_WIKI_PATH_RE = re.compile(r"(?:^|[\s`])(wiki/([^/`\s|]+))", re.IGNORECASE)


def split_row(line):
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def parse_tables(text):
    lines = text.splitlines()
    tables = []
    index = 0
    while index + 1 < len(lines):
        if lines[index].lstrip().startswith("|") and lines[index + 1].lstrip().startswith("|"):
            header = split_row(lines[index])
            separator = split_row(lines[index + 1])
            valid_separator = len(header) == len(separator) and all(
                re.fullmatch(r":?-{3,}:?", cell.replace(" ", "")) for cell in separator
            )
            if valid_separator:
                rows = []
                index += 2
                while index < len(lines) and lines[index].lstrip().startswith("|"):
                    cells = split_row(lines[index])
                    if len(cells) == len(header):
                        rows.append(dict(zip(header, cells)))
                    index += 1
                tables.append((header, rows))
                continue
        index += 1
    return tables


def find_table(tables, columns):
    """Find a table by accepted column names and normalize rows to canonical keys."""
    for header, rows in tables:
        selected = {
            canonical: next((alias for alias in aliases if alias in header), None)
            for canonical, aliases in columns.items()
        }
        if all(selected.values()):
            return [
                {canonical: row.get(actual, "") for canonical, actual in selected.items()}
                for row in rows
            ]
    return None


def nonempty(value):
    value = (value or "").strip()
    return bool(value and value not in {"-", "N/A", "None"} and not value.startswith("<"))


def is_excluded_java_test(path):
    lower_parts = [part.lower() for part in path.parts]
    under_src_test = any(
        lower_parts[i] == "src" and lower_parts[i + 1] == "test"
        for i in range(len(lower_parts) - 1)
    )
    name = path.name
    return under_src_test or name == "test.java" or name.endswith(("Test.java", "Tests.java", "IT.java"))


def resolve_anchor(workspace, raw):
    match = ANCHOR_RE.search(raw or "")
    if not match:
        return "missing a file:line anchor"
    path = Path(match.group(1).strip().strip("`"))
    start = int(match.group(2))
    end = int(match.group(3) or start)
    if not path.is_absolute():
        path = workspace / path
    if not path.is_file():
        return f"file does not exist: {path}"
    if is_excluded_java_test(path):
        return "Java test source is excluded"
    try:
        line_count = sum(1 for _ in path.open("r", encoding="utf-8", errors="replace"))
    except OSError as exc:
        return f"cannot read file: {exc}"
    if start < 1 or end < start or end > line_count:
        return f"invalid line range; file has {line_count} lines"
    return None


def load_registry(product_dir, workspace, errors, warnings):
    path = product_dir / "evidence-registry.md"
    if not path.is_file():
        errors.append(f"missing required artifact: {path}")
        return {}, {}, {}, {}, set()

    tables = parse_tables(path.read_text(encoding="utf-8"))
    evidence_rows = find_table(tables, {
        "id": ("Evidence ID",),
        "label": ("Label",),
        "status": ("Status",),
        "anchor": ("Exact anchor",),
        "verified_by": ("Verified by",),
    })
    claim_rows = find_table(tables, {
        "id": ("Claim ID",),
        "label": ("Label",),
        "status": ("Status",),
        "basis": ("Basis Evidence IDs",),
    })
    issue_rows = find_table(tables, {
        "id": ("Issue ID",),
        "label": ("Label",),
        "critical": ("Critical",),
        "status": ("Status",),
        "evidence": ("Evidence IDs",),
    })
    decision_rows = find_table(tables, {
        "decision_id": ("Decision ID",),
        "question_id": ("Question ID",),
        "status": ("Status",),
    }) or []

    if evidence_rows is None:
        errors.append("evidence-registry.md is missing the Evidence Records table")
        evidence_rows = []
    if claim_rows is None:
        errors.append("evidence-registry.md is missing the Design Claims table")
        claim_rows = []
    if issue_rows is None:
        errors.append("evidence-registry.md is missing the Issue Register table")
        issue_rows = []

    evidence, claims, issues, decisions, questions = {}, {}, {}, {}, set()
    seen = set()

    for row in evidence_rows:
        item_id = row["id"].strip("`")
        if not nonempty(item_id) or "<" in item_id:
            continue
        if not ID_RE.fullmatch(item_id) or not item_id.startswith(("R-", "F-", "S-")):
            errors.append(f"invalid evidence ID format: {item_id}")
            continue
        if item_id in seen:
            errors.append(f"duplicate ID: {item_id}")
            continue
        seen.add(item_id)
        evidence[item_id] = row
        label, status = row["label"].upper(), row["status"].upper()
        if label in {"FACT", "REQUIREMENT"} and status == "VERIFIED":
            if not nonempty(row["verified_by"]):
                errors.append(f"{item_id}: VERIFIED {label} is missing Verified by")
            anchor_error = resolve_anchor(workspace, row["anchor"])
            if anchor_error:
                errors.append(f"{item_id}: {anchor_error}: {row['anchor']}")
        elif label == "FACT" and status not in {"FOUND", "VERIFIED", "REJECTED", "STALE", "SUPERSEDED"}:
            errors.append(f"{item_id}: invalid FACT status: {status}")
        elif label == "REQUIREMENT" and status not in {"VERIFIED", "STALE", "SUPERSEDED"}:
            errors.append(f"{item_id}: invalid REQUIREMENT status: {status}")

    for row in claim_rows:
        item_id = row["id"].strip("`")
        if not nonempty(item_id) or "<" in item_id:
            continue
        if not ID_RE.fullmatch(item_id) or not item_id.startswith(("P-", "D-")):
            errors.append(f"invalid claim ID format: {item_id}")
            continue
        if item_id in seen:
            errors.append(f"duplicate ID: {item_id}")
            continue
        seen.add(item_id)
        claims[item_id] = row
        for basis in ID_RE.findall(row["basis"]):
            if basis.startswith(("R-", "F-")) and basis not in evidence:
                errors.append(f"{item_id}: references unknown evidence ID: {basis}")

    for row in issue_rows:
        item_id = row["id"].strip("`")
        if not nonempty(item_id) or "<" in item_id:
            continue
        if not ID_RE.fullmatch(item_id) or not item_id.startswith(("A-", "G-", "C-")):
            errors.append(f"invalid issue ID format: {item_id}")
            continue
        if item_id in seen:
            errors.append(f"duplicate ID: {item_id}")
            continue
        seen.add(item_id)
        issues[item_id] = row
        for basis in ID_RE.findall(row["evidence"]):
            if basis.startswith(("R-", "F-")) and basis not in evidence:
                warnings.append(f"{item_id}: references unknown evidence ID: {basis}")

    for row in decision_rows:
        decision_id = row["decision_id"].strip("`")
        question_id = row["question_id"].strip("`")
        if not nonempty(decision_id) or "<" in decision_id:
            continue
        if not ID_RE.fullmatch(decision_id) or not decision_id.startswith("D-"):
            errors.append(f"invalid Decision Map decision ID format: {decision_id}")
            continue
        if decision_id in decisions:
            errors.append(f"duplicate Decision Map decision ID: {decision_id}")
            continue
        decisions[decision_id] = row
        if decision_id not in claims:
            errors.append(f"Decision Map decision ID does not appear in Design Claims: {decision_id}")
        if nonempty(question_id) and "<" not in question_id:
            if not ID_RE.fullmatch(question_id) or not question_id.startswith("Q-"):
                errors.append(f"invalid Decision Map question ID format: {question_id}")
            else:
                questions.add(question_id)

    return evidence, claims, issues, decisions, questions


def parse_top_level_map_keys(text, section_name):
    """Return keys of a top-level YAML map section without requiring PyYAML."""
    lines = text.splitlines()
    keys = []
    in_section = False
    section_indent = None
    for raw in lines:
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        indent = len(raw) - len(raw.lstrip(" "))
        stripped = raw.strip()
        if not in_section:
            if re.fullmatch(rf"{re.escape(section_name)}\s*:\s*(?:#.*)?", stripped):
                in_section = True
                section_indent = indent
            continue
        if indent <= section_indent:
            break
        # Immediate map keys only (section indent + 2 spaces is the workspace.yaml style).
        if indent == section_indent + 2 and re.match(r"^[A-Za-z0-9._-]+\s*:", stripped):
            key = stripped.split(":", 1)[0].strip()
            if key not in keys:
                keys.append(key)
    return keys


def load_workspace_registry(workspace):
    config_path = Path(workspace) / "workspace.yaml"
    if not config_path.is_file():
        return {"sources": [], "wiki": [], "present": False}
    text = config_path.read_text(encoding="utf-8")
    return {
        "sources": parse_top_level_map_keys(text, "sources"),
        "wiki": parse_top_level_map_keys(text, "wiki"),
        "present": True,
    }


def normalize_root_path(value):
    rel = (value or "").strip().strip("`").strip()
    rel = rel.replace("\\", "/")
    while rel.startswith("./"):
        rel = rel[2:]
    return rel.rstrip("/")


def is_bare_collection_root(value):
    rel = normalize_root_path(value)
    return bool(BARE_COLLECTION_ROOT_RE.fullmatch(rel))


def managed_ids_mentioned(plan_text, selected_rows, impact_rows):
    """Collect managed source/wiki ids referenced by concrete paths or source ids.

    Source ids come from `sources/<id>` paths and the Source ID column; wiki ids come
    from `wiki/<id>` paths. A Source ID names a managed source project only — it does
    NOT imply a wiki entry exists for it. Wiki and sources are independent collections,
    so a source id is never also treated as a wiki id.
    """
    source_ids = set()
    wiki_ids = set()
    blobs = [plan_text]
    for row in selected_rows:
        blobs.extend([row.get("wiki", ""), row.get("sources", ""), row.get("source_id", "")])
    for row in impact_rows:
        blobs.extend(row.values())
    joined = "\n".join(blobs)
    for match in MANAGED_SOURCE_PATH_RE.finditer(joined):
        source_ids.add(match.group(2))
    for match in MANAGED_WIKI_PATH_RE.finditer(joined):
        wiki_ids.add(match.group(2))
    # A Source ID names a managed source project; it is not also a wiki id.
    for row in list(selected_rows) + list(impact_rows):
        source_id = (row.get("source_id") or "").strip().strip("`")
        if source_id:
            source_ids.add(source_id)
    return source_ids, wiki_ids


def validate_plan(product_dir, workspace, errors):
    path = product_dir / "research-plan.md"
    if not path.is_file():
        errors.append(f"missing required artifact: {path}")
        return
    plan_text = path.read_text(encoding="utf-8")
    tables = parse_tables(plan_text)
    sources = find_table(tables, {
        "source_id": ("Source ID",),
        "sources": ("Sources root",),
        "wiki": ("Wiki coverage",),
    })
    impact_rows = find_table(tables, {
        "source_id": ("Source ID",),
        "decision": ("Decision",),
        "reason": ("Exclusion reason",),
    })
    coverage_rows = find_table(tables, {
        "requirement_id": ("Requirement ID",),
        "owning_source": ("Owning source",),
        "status": ("Status",),
    })
    boundary_rows = find_table(tables, {
        "boundary_id": ("Boundary ID",),
        "left_source": ("Caller/producer source",),
        "right_source": ("Provider/consumer source",),
        "status": ("Status",),
    })

    if sources is None:
        errors.append("research-plan.md is missing the Selected Sources table")
        sources = []
    if impact_rows is None:
        errors.append("research-plan.md is missing the Candidate Source Impact Map table")
        impact_rows = []
    if coverage_rows is None:
        errors.append("research-plan.md is missing the Requirement-to-Source Coverage table")
        coverage_rows = []
    if boundary_rows is None:
        errors.append("research-plan.md is missing the Cross-Source Boundary Coverage table")
        boundary_rows = []

    selected_sources = set()
    for row in sources:
        source_id = row["source_id"].strip().strip("`")
        if not nonempty(source_id):
            continue
        if source_id in selected_sources:
            errors.append(f"duplicate selected source: {source_id}")
            continue
        selected_sources.add(source_id)
        # Sources root is mandatory: must not be a bare collection root and must exist.
        rel = row["sources"].strip().strip("`")
        if is_bare_collection_root(rel):
            errors.append(
                f"source {source_id} uses bare collection root as Sources root: {rel} "
                f"(use sources/<id>)"
            )
        else:
            path_value = Path(rel)
            if not path_value.is_absolute():
                path_value = workspace / path_value
            if not path_value.exists():
                errors.append(f"source {source_id} has a missing Sources root: {rel}")
        # Wiki coverage is optional discovery context: only the bare-root guard runs,
        # and only when a value is present. A source may have no wiki coverage.
        wiki_rel = row["wiki"].strip().strip("`")
        if nonempty(wiki_rel) and is_bare_collection_root(wiki_rel):
            errors.append(
                f"source {source_id} uses bare collection root as Wiki coverage: {wiki_rel} "
                f"(use wiki/<id>[/<project>])"
            )
    if not selected_sources:
        errors.append("research-plan.md has no selected sources")

    impact_sources = set()
    for row in impact_rows:
        source_id = row["source_id"].strip().strip("`")
        if not nonempty(source_id):
            continue
        if source_id in impact_sources:
            errors.append(f"duplicate candidate-impact source: {source_id}")
            continue
        impact_sources.add(source_id)
        decision = row["decision"].strip().upper()
        if decision not in {"SELECT", "EXCLUDE"}:
            errors.append(f"candidate-impact source {source_id} has invalid Decision: {row['decision']}")
        if decision == "EXCLUDE" and not nonempty(row["reason"]):
            errors.append(f"excluded candidate-impact source {source_id} is missing an exclusion reason")
    for source_id in sorted(selected_sources - impact_sources):
        errors.append(f"selected source {source_id} is missing from the Candidate Source Impact Map")

    covered_requirements = 0
    for row in coverage_rows:
        requirement_id = row["requirement_id"].strip().strip("`")
        if not nonempty(requirement_id):
            continue
        covered_requirements += 1
        if not ID_RE.fullmatch(requirement_id) or not requirement_id.startswith("R-"):
            errors.append(f"invalid requirement coverage ID: {requirement_id}")
        owning_source = row["owning_source"].strip().strip("`")
        if not nonempty(owning_source):
            errors.append(f"requirement coverage {requirement_id} is missing an owning source")
        elif owning_source not in selected_sources:
            errors.append(f"requirement coverage {requirement_id} references an unselected owning source: {owning_source}")
        if not nonempty(row["status"]):
            errors.append(f"requirement coverage {requirement_id} is missing Status")
    if not covered_requirements:
        errors.append("research-plan.md has no requirement-to-source coverage rows")

    seen_boundaries = set()
    for row in boundary_rows:
        boundary_id = row["boundary_id"].strip().strip("`")
        if not nonempty(boundary_id):
            continue
        if boundary_id in seen_boundaries:
            errors.append(f"duplicate cross-source boundary: {boundary_id}")
            continue
        seen_boundaries.add(boundary_id)
        for endpoint, source_id in (("caller/producer", row["left_source"]), ("provider/consumer", row["right_source"])):
            source_id = source_id.strip().strip("`")
            if not nonempty(source_id):
                errors.append(f"cross-source boundary {boundary_id} is missing the {endpoint} source")
            elif source_id not in selected_sources:
                errors.append(f"cross-source boundary {boundary_id} references an unselected {endpoint} source: {source_id}")
        if not nonempty(row["status"]):
            errors.append(f"cross-source boundary {boundary_id} is missing Status")

    # Registry coverage: every managed source id must be explicitly selected or excluded
    # in the Candidate Source Impact Map; every managed wiki id must be referenced by a
    # wiki/<id> path somewhere in the plan (wiki is discovery context, independent of any
    # source). This universal rule replaces the old multi-source/one-pair special case.
    registry = load_workspace_registry(workspace)
    if registry["present"]:
        _, mentioned_wiki = managed_ids_mentioned(plan_text, sources, impact_rows)
        for source_id in registry["sources"]:
            if source_id not in impact_sources:
                errors.append(
                    f"workspace.yaml source \"{source_id}\" is not covered in research-plan.md "
                    f"(include it as SELECT or EXCLUDE with a reason in the Candidate Source Impact Map)"
                )
        for wiki_id in registry["wiki"]:
            if wiki_id not in mentioned_wiki and f"wiki/{wiki_id}" not in plan_text:
                errors.append(
                    f"workspace.yaml wiki \"{wiki_id}\" is not covered in research-plan.md "
                    f"(reference wiki/{wiki_id} in the plan, e.g. as Wiki coverage for a selected source)"
                )


def validate_briefs(product_dir, workspace, errors, warnings):
    brief_dir = product_dir / "briefs"
    if not brief_dir.is_dir():
        warnings.append(f"research brief directory not found: {brief_dir}")
        return
    seen = set()
    for path in sorted(brief_dir.glob("*.md")):
        tables = parse_tables(path.read_text(encoding="utf-8"))
        candidates = find_table(tables, {
            "id": ("Candidate ID",),
            "label": ("Label",),
            "status": ("Status",),
            "anchor": ("Exact raw anchor",),
        })
        if candidates is None:
            errors.append(f"{path.name} is missing the Evidence Candidates table")
            continue
        for row in candidates:
            item_id = row["id"].strip("`")
            if not nonempty(item_id) or "<" in item_id:
                continue
            if item_id in seen:
                errors.append(f"duplicate research-brief candidate ID: {item_id}")
            seen.add(item_id)
            if row["label"].upper() == "FACT":
                if row["status"].upper() != "FOUND":
                    errors.append(f"{path.name}: FACT candidate {item_id} must be FOUND")
                anchor_error = resolve_anchor(workspace, row["anchor"])
                if anchor_error:
                    errors.append(f"{path.name}: {item_id}: {anchor_error}: {row['anchor']}")


def validate_document(path, mode, evidence, claims, issues, decisions, questions, errors):
    if not path or not path.is_file():
        errors.append(f"missing {mode} document: {path}")
        return
    text = path.read_text(encoding="utf-8")
    expected_status = "final" if mode == "final" else "draft"
    if not re.search(rf"^status:\s*{expected_status}\s*$", text, re.MULTILINE):
        errors.append(f"{path.name}: frontmatter status must be {expected_status}")
    if PLACEHOLDER_RE.search(text):
        errors.append(f"{path.name}: contains unreplaced placeholders")

    known = set(evidence) | set(claims) | set(issues) | set(decisions) | questions
    for item_id in sorted(set(ID_RE.findall(text))):
        if item_id not in known:
            errors.append(f"{path.name}: references unknown ID: {item_id}")
        elif item_id.startswith(("R-", "F-")) and evidence[item_id]["status"].upper() != "VERIFIED":
            label = evidence[item_id]["label"].upper()
            errors.append(f"{path.name}: {label} {item_id} is not VERIFIED")

    for header, rows in parse_tables(text):
        change_col = next((name for name in ("Change type",) if name in header), None)
        if not change_col:
            continue
        necessity_col = next((name for name in header if "ADD" in name and any(k in name for k in ("necessity", "insufficiency"))), None)
        evidence_col = next((name for name in header if any(k in name for k in ("Evidence", "Claim"))), None)
        if not necessity_col:
            continue
        for index, row in enumerate(rows, 1):
            if re.search(r"\bADD\b", row.get(change_col, "").upper()):
                if not nonempty(row.get(necessity_col)):
                    errors.append(f"{path.name}: ADD row {index} is missing existing-seam insufficiency evidence")
                if evidence_col and not nonempty(row.get(evidence_col)):
                    errors.append(f"{path.name}: ADD row {index} is missing an evidence or claim ID")

    if mode == "final":
        for issue_id, row in issues.items():
            critical = row["critical"].strip().lower() in {"yes", "y", "true"}
            status, label = row["status"].upper(), row["label"].upper()
            if critical and label in {"GAP", "CONFLICT"} and status not in {"RESOLVED", "ACCEPTED"}:
                errors.append(f"{path.name}: unresolved critical {label} {issue_id} blocks finalization")
        for decision_id, row in decisions.items():
            if row["status"].upper() not in {"ACCEPTED", "SUPERSEDED"}:
                errors.append(f"{path.name}: Decision Map entry {decision_id} is not confirmed")
        for claim_id, row in claims.items():
            if row["label"].upper() == "DECISION" and row["status"].upper() not in {"ACCEPTED", "SUPERSEDED"}:
                errors.append(f"{path.name}: design decision {claim_id} is not confirmed")


def discover_doc(product_dir, suffix):
    exact = product_dir / f"{product_dir.name}{suffix}"
    if exact.is_file():
        return exact
    excluded = {"research-plan.md", "evidence-registry.md", "gate-report.md"}
    matches = [
        path for path in sorted(product_dir.glob(f"*{suffix}"))
        if path.name not in excluded and not (suffix == ".md" and path.name.endswith(".draft.md"))
    ]
    return matches[0] if len(matches) == 1 else None


def main():
    parser = argparse.ArgumentParser(description="Lightweight validation for ba2md evidence and deliverables")
    parser.add_argument("--workspace", required=True, type=Path, help="project workspace root")
    parser.add_argument("--product-dir", required=True, type=Path, help="product/<slug> artifact directory")
    parser.add_argument("--mode", choices=["plan", "briefs", "draft", "final", "all"], default="all", help="validation stage")
    parser.add_argument("--document", type=Path, help="explicit draft or final document path")
    args = parser.parse_args()

    workspace, product_dir = args.workspace.resolve(), args.product_dir.resolve()
    errors, warnings = [], []
    if not product_dir.is_dir():
        errors.append(f"artifact directory does not exist: {product_dir}")
    else:
        if args.mode in {"plan", "briefs", "draft", "final", "all"}:
            validate_plan(product_dir, workspace, errors)
        if args.mode in {"briefs", "draft", "final", "all"}:
            validate_briefs(product_dir, workspace, errors, warnings)
        if args.mode in {"draft", "final", "all"}:
            evidence, claims, issues, decisions, questions = load_registry(product_dir, workspace, errors, warnings)
            mode = args.mode if args.mode in {"draft", "final"} else "draft"
            document = args.document.resolve() if args.document else discover_doc(product_dir, ".draft.md" if mode == "draft" else ".md")
            validate_document(document, mode, evidence, claims, issues, decisions, questions, errors)

    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"FAILED: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1
    print(f"PASSED: 0 errors, {len(warnings)} warning(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
