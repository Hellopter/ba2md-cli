# Requirement Directory Input

Allow users to place Markdown requirements in a directory and invoke `$ba2md` without pasting their contents into the conversation. Keep requirement documents read-only.

## Default Directory and Invocation Modes

Use `{WORKSPACE}/requirements/` as the default requirement root. An explicit user-provided file or directory path takes precedence.

Support three entry modes:

- **Explicit file**: process only the one or more `.md` paths supplied by the user.
- **On-demand match**: match a filename, requirement ID, title, or keyword, then read only matching candidates.
- **Directory queue**: when the user invokes only `$ba2md` or requests all requirements, discover only direct child `.md` files under `{WORKSPACE}/requirements/` (`requirements/*.md`) and process them one at a time in natural filename order. Do not recurse into subdirectories.

Treat `README.md`, `index.md`, and directory guide pages as navigation by default rather than independent SDD inputs. Process one as a requirement only when its body contains substantive objectives, scope, and acceptance criteria, or when the user selects it explicitly. If the selected requirement directory is missing or contains no processable Markdown, stop discovery and ask for a file or directory path. Do not fall back to guessing the requirement.

## Progressive Reading

Do not load every requirement file in full at the start:

1. Enumerate relative paths.
2. Read frontmatter, title, H1/H2 headings, and Markdown links for candidate files to build a lightweight index.
3. Select the current requirement unit from the user's reference, title/keyword matches, and link relationships.
4. Fully read only the main requirement file for that unit.
5. Read attachments, supplements, or linked documents only when needed to resolve scope, acceptance, or terminology.

Treat one standalone `.md` as one requirement unit by default. If the main file explicitly links a nearby supporting document, include that document in the same unit rather than generating another SDD. Ask whether files should be merged or kept separate only when the ambiguity materially changes scope.

## Queue and Resume

The directory queue is not a new design stage. Each requirement unit independently runs the execution graph and owns its own `product/<slug>/`, evidence registry, draft, gate report, and Decision Map. Never mix evidence IDs or user decisions across units.

Choose the default slug in this order:

1. Use an explicit user-provided slug.
2. For file input, normalize the filename as `<file-stem>-sdd`.
3. On filename collision within the flat `requirements/` directory, ask the user or require an explicit slug.
4. For conversational input, use `YYYY-MM-DD-<short-name>-sdd`.

Record the main requirement file, supporting files, selection rationale, SHA-256 values, and reading status in `research-plan.md`. On a later run:

- Missing output directory: start a new run.
- Existing output with unchanged requirement hashes: resume from the recorded stage without overwriting artifacts.
- Changed requirement hash: return to Requirement Intake, analyze the change, mark affected sections `DIRTY`, and rerun the appropriate gate after updates.
- Completed output with unchanged hashes: skip by default unless the user requests regeneration.

Advance only one requirement unit at a time in batch mode. If the current unit needs a user decision, additional source material, or final confirmation, pause it with an explicit status. Do not mix another requirement's questions into the current discussion.

## Requirement Anchors and Evidence Boundary

Represent requirement statements as `REQUIREMENT` records with IDs shaped as `R-<REQ>-NNN`. Use anchors such as:

```text
requirements/refund-adjustment.md:24-38
```

`VERIFIED REQUIREMENT` means only that the main agent reopened the requirement text and confirmed that the interpretation matches the anchor. It may support objectives, scope, business rules, and acceptance criteria. It cannot prove current API paths, fields, class names, schemas, authorization configuration, rate limits, or alerts; those require `VERIFIED FACT` records.

Record disagreements among requirement documents as `CONFLICT`. A missing business decision in requirement prose may become a user discussion question. Missing current-system evidence must become a `GAP`, not a request for the user to guess.
