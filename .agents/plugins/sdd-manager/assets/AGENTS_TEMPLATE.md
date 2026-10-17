# Agent instructions

## Specification-driven development

This project uses the SDD Manager plugin for specification-driven development. If not already in the context, load `PLUGIN.md` from installed location or from `.agents/plugins/sdd-manager/PLUGIN.md` and the coordinator skill entry it references. If neither source is available, report the missing plugin before dependent workflow work.

**Follow the applicable SDD Manager workflows, including human checkpoints, Git publication and integration, and the tracking policy below.**

## Initialization

Execute the [skill and plugin discovery protocol](SKILL_DISCOVERY_PROTOCOL.md).

## Workflow continuity

For continuation, read `docs/dev/HANDOFF.md` and use `sdd-manage`'s continuity subworkflow to reconstruct later work from current development records and Git. The handoff describes a checkpoint, not necessarily the branch tip. At startup, inspect unfinished workflow branches against their recorded parents and request the continuation branch unless already selected. Preserve the recovered scope, approvals and stopping boundary.

## Human checkpoints

Present each necessary new development document with concise substantive analysis and pause for acceptance before dependent work. Honor the user's requested implementation range and stop when it is complete.

The user may explicitly preapprove future checkpoints at any time. Retain the scope and conditions of that decision, including after interruption; do not repeat a covered approval request. Preapproval does not waive QC, resolve blockers or expand the authorized implementation range.

## Commits and publication

Keep each task's verified result, required evidence and completion checkbox in the same commit. Push every owned commit and verify remote containment before further work or another commit, unless the user explicitly directs local-only or deferred publication.

Documentation tasks and their issues track development through first approval: mark the task complete in the commit submitting the approved document, then close its issue after verified publication. Later document revisions leave that task complete and its issue closed. Honor applicable checkpoint preapproval.

Use SDD Manager's integration procedure at the authorized complete boundary. For main preparation, pass package QC, publish the documentation merge, close the preparation milestone when tracking is enabled and confirm the final checkpoint before implementation.

## GitHub tracking

Enable and maintain GitHub tracking for documentation preparation and implementation **by default**. The user may disable tracking, select local-only work or choose another supported backend. Resolve this project default before initialization writes when main preparation will install this template. Copying it does not reset an established choice. Preserve that choice through interruptions; do not silently change it after an access failure.

When backend tracking is enabled, establish and verify the required objects before dependent repository work. Keep each task's issue associated with its actual milestone and close it only after verified completion is committed and published.

On interruption or backend failure, reconcile actual state and report pending operations. Preserve completed work without claiming unverified hosted effects or bypassing required gates.

### Documentation preparation

Use `sdd-manage`’s main preparation workflow to create or reconcile the native `docs-main` milestone and all nine DOCS task issues, verifying their associations by readback **before repository modifications**. Each document issue tracks development through first approval and closes only after its approved-document/checked-task commit is published and verified. Later revisions leave it closed. After final package QC and issue closure, merge, verify and publish the docs branch; then close and verify the `docs-main` milestone.

### Implementation

Apply `sdd-manage`’s phase activation workflow before implementing each eligible phase: create or reconcile its phase label, all milestones and all task issues, including review tasks, and verify their associations by readback. Maintain task issues and milestones throughout execution, closing them only after the required completion, evidence and publication gates. Activate later phases only when eligible.

If a required tracking prerequisite cannot be satisfied, report the blocker and stop affected preparation or implementation. Reconcile uncertain operations before retrying; preserve verified local results without claiming unverified hosted effects.

## Project guidance

Maintain project-specific navigation and validated setup/check commands here as they become established. Do not invent commands, paths, requirements or completion claims.
