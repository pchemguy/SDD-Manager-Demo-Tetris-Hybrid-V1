# GitHub main preparation tracking

Use for `docs-main` creation/readback, preparation issue lookup/closure and final milestone closure, including direct calls. Load the parent [GitHub backend](github.md) for repository/access, protected authentication and operational-failure rules. The coordinator's [main preparation](../../sdd-manage/references/main-preparation.md) owns readiness, local DOCS_TASKS, first approval, Git persistence and the final human checkpoint. This module performs hosted operations only.

## Identity and pre-write projection

Require the actual repository, selected preparation-tracking scope and its request/project-policy source from **sdd-manage**. Before target files or branches are modified, read `assets/DOCS_TASKS_TEMPLATE.md` from the running/pinned package; it supplies the nine predefined tasks without requiring target PLAN/TASKS or a local list yet. On resume also inspect existing `docs/dev/DOCS_TASKS.md`, actual decisions and retained hosted identities. Conflicting task identity/scope blocks projection; do not replace an existing list to make it match a newer template.

| Object | Identity and content |
| --- | --- |
| Native milestone | Title `docs-main`; description marker `<!-- sdd-forge:docs-milestone=docs-main -->`; outcome: main documentation preparation, package QC and verified published documentation integration |
| Nine task issues | Titles `[DOCS-001] Initialize the repository for SDD Manager` through the exact DOCS-009 title from the task template; body markers identify the stable task and preparation scope |

Use the same exact task-marker convention as [TASKS projection](github-projection.md), with an additional preparation scope marker:

```markdown
<!-- sdd-forge:docs-scope=main -->
## Task brief <!-- sdd-forge:task-id=DOCS-002 -->

**Outcome:** PROJECT developed through first approval.
**Scope and dependencies:** DOCS-001 complete; project brief and necessary children.
**Acceptance and verification:** Required QC, human approval or applicable explicit preapproval, approved document and checked DOCS task in one published commit.
**Sources:** Running package task template; target DOCS_TASKS and document when present.
<!-- /sdd-forge:task-id=DOCS-002 -->
```

Draft each issue from its actual template task and prerequisites, including DOCS-001's four-file preservation/partial-presence report and DOCS-009's whole-package QC. Use **sdd-report** when available. Do not invent issue URLs, document links before files exist, product implementation IDs, phase labels, phase review milestones or another local issue-map file.

1. Enumerate open and closed milestones/issues with complete pagination; exclude PRs. Match exact stable markers and validate titles, scope and ownership. A renamed uniquely marked object may be reconciled within scope; duplicate, contradictory or unmarked same-identity candidates require resolution rather than another object.
2. Create/reuse the native `docs-main` milestone. Create/reuse all nine issues and assign that milestone, preserving unrelated labels/fields and existing evidence. Reuse completed first-approval issues without reopening them for later revisions.
3. Read back the exact milestone and each issue's marker, identity and association. Return IDs/URLs, created/matched/updated state and unresolved differences. **Only complete verified projection clears the coordinator's pre-write gate.** Partial creation, uncertain writes or inaccessible lookup remain pending; inspect real state before retrying, never create duplicates to evade uncertainty.

GitHub is the projection, not authority for local completion. An existing closed milestone or issue does not prove accepted documents, QC or published integration. Report inconsistent prior closure and resolve its scope/evidence rather than certify readiness from provider state.

## Complete preparation issues

Before closure resolve the unique marked issue, current repository and milestone association. Require the coordinator's actual task completion evidence:

- **DOCS-001:** Original retained/copied outcomes for all four root files, verified preservation/copies, DOCS_TASKS completion and published initialization commit, or verified retained completion. A mixed-presence continuation pause may remain after initialization is complete.
- **DOCS-002–008:** First approval or applicable explicit preapproval, required QC, and the commit containing the approved document state and corresponding checked DOCS task, pushed with verified containment. A prior proposal commit leaves the task/issue incomplete. Resumed recognized approvals retain their actual evidence; do not claim a historical checkbox transition that never occurred.
- **DOCS-009:** Passing whole-package `docs/dev/DOCS-QC-REPORT.md` and checked final DOCS task in one verified published commit; all earlier preparation issue closures verified.

Add a concise evidence comment if absent, close as completed and read back state/reason under the existing issue operational-failure rules. Do not duplicate a matching comment or repeat a verified closure. The coordinator publishes before requesting closure; this backend creates no commits.

Document tasks/issues record development **through first approval**. Later revisions leave those tasks complete and issues closed; current document validity is assessed in the owning workflow/package QC instead. Implementation task invalidation/reopening semantics do not apply to these first-approval issues. A false or unsupported claim that first approval occurred is a separate evidence defect for the coordinator, not a normal later revision.

## Close the preparation milestone after integration

1. Resolve the unique milestone and all nine issue identities. Read every associated issue, including closed issues, with full pagination; foreign open issues, PRs or ambiguous ownership block closure and must be preserved.
2. Require all nine issues closed from verified completion, passing package QC and evidence of the documentation branch's **explicit two-parent merge into the actual default branch**, merged-state checks, target push and verified remote containment. Closed issues or a pushed documentation branch alone are insufficient.
3. Close the native `docs-main` milestone and read it back. An already correctly closed milestone needs verification, not another write. Unknown/failed closure stays pending; read actual state before retry. Return the milestone URL/state, completion and merge identities and any unresolved effects to **sdd-manage**.

The coordinator then confirms the final checkpoint before implementation. This preparation operation does not activate implementation objects, select a range or close an implementation phase. Local-only preparation has no hosted writes; it retains the coordinator's applicable local gates.
