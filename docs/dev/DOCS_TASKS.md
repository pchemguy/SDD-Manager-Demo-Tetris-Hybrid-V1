# Main documentation tasks

This list owns main documentation preparation. Product implementation tasks belong to `TASKS.md`. Complete these tasks in order, reusing valid existing artifacts and completion evidence when resuming.

## Completion and tracking

Each document task and its issue track development through the document’s first human approval. After that approval, mark the task complete. Later document revisions leave this task complete and its issue closed. An explicit preapproval may satisfy the human checkpoint within its stated scope; it does not waive QC or publication. The user may preapprove future checkpoints at any time.

Include the checked task in `DOCS_TASKS.md` in the same commit that submits the approved document and records its first approval. If the reviewed document was already published unchanged, retain that exact document state in the acceptance commit; do not rewrite it merely to create a diff. Push and verify remote containment before closing the corresponding issue or advancing.

When tracking is enabled, each `DOCS-*` task maps to one issue in the `docs-main` milestone. Verify the milestone, all nine issues and their associations before modifying the repository. Reuse their stable identities on resume. Close issues only after the corresponding completion commit is published and verified. With tracking disabled, apply the same local task and checkpoint requirements.

## Preparation

- [x] DOCS-001 — Initialize the repository for SDD Manager.
    - Inspect root `AI_DISCLOSURE.md`, `SDD-MANAGER.md`, `AGENTS.md` and `SKILL_DISCOVERY_PROTOCOL.md` before copying. Preserve existing files and copy only missing files from the bundled templates.
    - Record which root files existed and which were copied; verify copied bytes and preserved content.
    - Establish/reconcile `docs/dev/HANDOFF.md` as generated checkpoint metadata, outside the four-file presence/copy test. Include it with this task's completion and initialization result, push and verify; then close and verify its issue when tracking is enabled.
    - Report initialization. If some but not all of the four root files existed initially, warn with the retained/copied filenames and end the turn before document work, unless the user explicitly preapproved continuation through this checkpoint. If none or all existed, continue without an additional approval pause.
    - Initialization result: all four root files existed initially: `AI_DISCLOSURE.md`, `SDD-MANAGER.md`, `AGENTS.md`, and `SKILL_DISCOVERY_PROTOCOL.md`. All were preserved byte for byte against the branch-off commit; none were copied. No mixed-presence continuation pause applies.
    - Verified `docs-main` milestone 1 and DOCS-001–009 issues #1–#9, with exact task markers and milestone associations, before repository modifications. Tracking is selected by root AGENTS policy.
    - Established `HANDOFF.md` and credential exclusion/protection. This checked task and initialization result are submitted together; confirm publication and issue closure from actual Git/GitHub evidence.
    - Authority: on 2026-10-17 the user explicitly authorized required repository branches, commits, pushes, merges, and GitHub milestone/issue tracking within the agreed scope. Human document checkpoints remain in effect; no future checkpoints were preapproved.

- [x] DOCS-002 — Prepare and accept PROJECT.
    - Establish the project brief: purpose, users, outcomes, scope, non-goals and consequential constraints; identify material assumptions and unresolved decisions.
    - Review the proposal with the human and complete its acceptance checkpoint.
    - Proposal: `PROJECT.md` covers the user-confirmed classic baseline and hold, ghost, 7-bag, wall kicks, and hard drop in the first completed version. The user confirmed TypeScript, keyboard controls, and automated gameplay tests in the conversation.
    - Proposed product boundaries: desktop keyboard play, client-side application, and no accounts/backend/multiplayer/touch/audio/settings/saved games in the initial scope. These boundaries were accepted with PROJECT on 2026-10-17.
    - Review evidence: confirmed-capability coverage, separation of proposals from established decisions, local link checks, Markdown spacing, and diff integrity checked. Exact gameplay rules remain for design/SPEC. PROJECT was approved on 2026-10-17 at the exact presented state in commit `8754e93c9f182017655741ac77fdd7ca86765143`; its brief blob is retained unchanged in this acceptance commit.
    - Future-checkpoint grant: the user wrote “Approved. Also pre-approved are checkpoints through the ned of the docs phase, including the merge” on 2026-10-17. This covers remaining documentation proposals, required QC, package completion, documentation integration and milestone closure. It does not select or authorize an implementation task range. Continue without further documentation acceptance pauses; technical blockers and publication/tracking gates remain in force.
- [x] DOCS-003 — Prepare and accept ARCHITECTURE.
    - Define major system blocks, relationships, dependency direction and consequential structural decisions from the accepted brief.
    - Review the proposal with the human and complete its acceptance checkpoint.
    - Completion: `docs/dev/ARCHITECTURE.md` SHA-256 `cef3e1597075374857ed2328a78830e76b6fcb775f9cde9ee564b09e6a590da4`; Reviewed block ownership, directed dependencies, explicit time/randomness, browser-resource lifecycle, alternatives, and verification seams against accepted PROJECT. No unresolved architectural blocker. PROJECT/README status was aligned with its recorded acceptance without changing scope. Acceptance basis: scoped documentation-checkpoint preapproval recorded under DOCS-002. Publication/readback and issue closure follow this commit and must be reconciled from Git/GitHub.

- [x] DOCS-004 — Prepare and accept DECOMPOSITION.
    - Define component responsibilities, collaboration, ownership and design-level interface boundaries consistently with ARCHITECTURE.
    - Review the proposal with the human and complete its acceptance checkpoint.
    - Completion: `docs/dev/DECOMPOSITION.md` SHA-256 `78ca4d9451410ed40dbb335f4a875ea9b134598827ef089dbae8e7c118ea2edf`; Reviewed C1–C7 responsibility, dependency direction, engine/snapshot/fixture ownership, timer/input collaboration, errors, disposal, and verification seams against accepted ARCHITECTURE. No ownership cycles or unresolved structural blocker. Acceptance basis: scoped documentation-checkpoint preapproval recorded under DOCS-002. Publication/readback and issue closure follow this commit and must be reconciled from Git/GitHub.

- [x] DOCS-005 — Prepare and accept SPEC.
    - Specify observable behavior, interfaces, error contracts, required qualities and acceptance conditions from the accepted design.
    - Complete required SPEC QC and its human acceptance checkpoint.
    - Completion: `docs/dev/SPEC.md` SHA-256 `f7737e7d2e927bc5f332b0a3883f8a8c07b751ed832b623c297e36af1bc9bfc6`; Completed R01–R12 and A1–A9 with explicit geometry, horizontal kicks, 500 ms grounded lock, immediate hard drop, bag/hold/ghost, scoring, input/lifecycle, errors and browser/build contracts. SPEC-REVIEW-REPORT records exact source identities, grouped C1–C7 conformance and Ready with no unresolved blocker. Product checks are planned, not performed. Acceptance basis: scoped documentation-checkpoint preapproval recorded under DOCS-002. Publication/readback and issue closure follow this commit and must be reconciled from Git/GitHub.

- [x] DOCS-006 — Prepare and accept PLAN.
    - Define delivery phases, milestones, dependencies and exit conditions against SPEC.
    - Complete PLAN QC, then present PLAN for human approval.
    - Completion: `docs/dev/PLAN.md` SHA-256 `5e831497b73305b77a32629912d0661fce92c63203e19d4e2668c159546f1a73`; Reviewed all R01–R12/A1–A9 delivery routes, earliest meaningful playable slice, dependencies and honest deferrals. One phase has four delivery milestones and a dedicated phase review milestone. PLAN-REVIEW-REPORT is Ready for strategy; TASKS remains held for layout and combined QC. Acceptance basis: scoped documentation-checkpoint preapproval recorded under DOCS-002. Publication/readback and issue closure follow this commit and must be reconciled from Git/GitHub.

- [x] DOCS-007 — Prepare and accept layout.
    - Allocate source, tests, documentation and artifacts to physical paths consistently with the accepted design and PLAN.
    - Review layout against the design and PLAN, update the PLAN review report, then present layout for human approval.
    - Completion: `docs/dev/layout.md` SHA-256 `d06b7f918a01e70eba1f59c032af94b9180efca6d8c7f01e565fd322a3fb83aa`; Mapped C1–C7, checks, fixture isolation, tooling, generated outputs, user/agent guidance and report homes. Appended PLAN review Revision 1 with exact layout identity and combined Ready for TASKS, preserving initial strategy review. No physical ownership blocker. Acceptance basis: scoped documentation-checkpoint preapproval recorded under DOCS-002. Publication/readback and issue closure follow this commit and must be reconciled from Git/GitHub.

- [x] DOCS-008 — Prepare and accept TASKS.
    - Derive executable tasks, dependencies and required milestone/phase review units from accepted SPEC, PLAN and layout.
    - Complete required task-list QC and its human acceptance checkpoint. Do not start implementation or project implementation-phase objects yet.
    - Completion: `docs/dev/TASKS.md` SHA-256 `f9269ddd7b8bc35f159b14717e49f0d4636b04088441140d0e3de52b819827ef`; Derived 21 unique unchecked tasks: 16 delivery and five explicit reviews within the PLAN parentage. Verified dependency order, 0/4/8-space hierarchy, C1–C7 paths, R01–R12/A1–A9 coverage and review/report/HANDOFF/closure exits. TASKS-REVIEW-REPORT records counts and rationale for the six-task early milestone; no unresolved blocker. Acceptance basis: scoped documentation-checkpoint preapproval recorded under DOCS-002. Publication/readback and issue closure follow this commit and must be reconciled from Git/GitHub.

- [x] DOCS-009 — Pass documentation package QC.
    - Require all preceding tasks complete and their issue closures verified when tracking is enabled.
    - Review the entire document set, necessary children and QC reports for consistency, traceability, delivery readiness and unresolved blockers. Check initialization, orientation, human acceptance and publication evidence.
    - Resolve blockers through their owning documents and recheck affected readiness and acceptance. Retain the package QC report with the preparation documents.
    - Refresh `docs/dev/HANDOFF.md` with the package outcome, evidence and next boundary, retaining later integration/milestone effects as requiring confirmation. Commit the handoff, passing report and this task marked complete together, push and verify; then close and verify the final QC issue.
    - Completion: `docs/dev/DOCS-QC-REPORT.md` SHA-256 `b964f1e4d3ee3bbeb935b79783e2cb64c3570e92236b18205e042f003623ff90`; Whole-package QC resolved DQC-001 fixture-domain precision and rechecked SPEC/PLAN/TASKS currency and coverage. Verified scope, authority, first approvals/preapproval, published earlier checkpoints/issue closures, design and task boundaries, counts/dependencies, navigation and source/credential preservation. Passing report and refreshed HANDOFF accompany this checked task. Product execution remains unverified; integration and hosted closure follow. Acceptance basis: scoped documentation-checkpoint preapproval recorded under DOCS-002. Publication/readback and issue closure follow this commit and must be reconciled from Git/GitHub.

## Integration and final checkpoint

After DOCS-009, explicitly merge the verified documentation branch into the actual default branch. Verify the merged result, commit, push and confirm remote containment. Then close and verify the `docs-main` milestone when tracking is enabled. Failed or uncertain integration or milestone closure remains pending; checked tasks alone do not complete preparation.

Report the package QC result, published merge and tracking status. Confirm the final checkpoint before implementation and obtain the authorized implementation range. Proceed without another pause only when explicit preapproval covers that checkpoint and implementation scope is already established.

On interruption, recover the earliest unmet operation from documents, acceptance decisions, Git and hosted evidence. Preserve a pending mixed-initialization decision. Do not regenerate the list, infer acceptance from file presence or repeat completed work. Honor explicit narrower scope, local-only or no-merge instructions and report any remaining completion steps.
