# Tetris implementation tasks

This is the complete intended implementation hierarchy derived from PLAN and layout. All tasks are initially unchecked. Documentation preapproval does not authorize an implementation range or phase activation.

Each delivery task includes relevant test-first work, module/user documentation, regression checks, and its verified result/evidence/initial checkbox in one task commit. Publish/read back before advancing, then reconcile its issue. Use the exact single leading task ID. Mandatory review tasks are executable tasks and count in any next-N selection.

Require current upstream QC, published preparation integration, authorized range and complete eligible-phase projection before executing T-001. No implementation objects are created during this preparation checkpoint.

## Phase 1 — Complete browser Tetris

- [ ] Phase 1 — Complete browser Tetris
    - [ ] Milestone 1.1 — Playable falling-block core
        - [ ] T-001 — Establish compatible tooling and browser capabilities
            Depends on: None; require accepted preparation integration, authorized range, and verified eligible-phase tracking before execution.
            Scope: Package/lockfile, strict TypeScript and Vite/Vitest/Playwright configuration, production skeleton, generated-output exclusions and setup guidance. Choose exact mutually compatible versions; keep npm scripts CMD-compatible.
            Acceptance/evidence: R12/A8. Demonstrate clean installation, declared runner/typecheck/build commands, all three browser binary launches, repeated session lifecycle and actual Canvas rendering using bounded setup probes. Record Node/package/browser versions and limits; do not claim probes establish game acceptance.
        - [ ] T-002 — Implement piece and board geometry
            Depends on: T-001.
            Scope: C1 types, pieces and board modules plus focused unit fixtures.
            Acceptance/evidence: R01/R07 and A1: all seven spawn shapes, rotation transforms, placement/bounds/overlap, ordered horizontal kick candidates, landing geometry and pure simultaneous row-removal helpers. Test boundaries and rejected candidates; no DOM dependency.
        - [ ] T-003 — Implement deterministic seven-bag draws and preview
            Depends on: T-002.
            Scope: C2 bag module, injected sample boundary and focused unit tests.
            Acceptance/evidence: R03/A2/A9: exact deterministic shuffle, permutation/refill boundaries, draw order/preview correspondence and invalid samples without partial bag mutation. Document randomness ownership.
        - [ ] T-004 — Implement engine session state movement and elapsed-time handling
            Depends on: T-003.
            Scope: C3 state/engine modules and isolated unit fixtures.
            Acceptance/evidence: R02/R04/R11 with A3/A9: fresh/start/restart state, fixture/snapshot isolation and rejection, horizontal/soft movement, explicit gravity accumulation and contact/airborne timing. This is an intermediate engine slice; full lock/clear/spawn integration completes in T-005.
        - [ ] T-005 — Integrate lock clear spawn and game-over transitions
            Depends on: T-004.
            Scope: C3 transition orchestration using C1 row/placement helpers; engine unit/integration tests.
            Acceptance/evidence: R02/R04/R05 and A3/A4: exact 499/500 ms contact, ordered lock/clear/spawn/top-out, simultaneous 1–4 row removal, retained row order, multiple-event advancement and no double locking. Score/level progression remains scoped to T-009.
        - [ ] T-006 — Integrate the playable browser core
            Depends on: T-005.
            Scope: C5/C6/C7 application, Canvas/HTML shell, native basic input, loop and start/restart bindings; deterministic browser harness and core scenarios.
            Acceptance/evidence: R02/R09/R10/R12 with A7/A8: start, move, soft descend, timed lock, clear, next spawn, top-out and restart through the actual app in all three engines, including observed rendered board/status. Keep harness excluded from production. Document the working subset and explicit milestone deferrals.
        - [ ] T-007 — Review test and report milestone 1.1
            Depends on: T-001, T-002, T-003, T-004, T-005, T-006; all constituent task issue closures verified.
            Scope/evidence: separate code review of milestone capability and dependencies, required tests/regressions and PLAN exits, blocker repairs, truthful usability/function demonstration and findings/TODO disposition. Report: `docs/dev/reports/phases/1/1.1.md`. Refresh HANDOFF in the same checked-review-task commit; publish, close/read back review issue, then milestone.
            SPEC trace: the milestone delivery contracts above and [PLAN](PLAN.md) exits.
    - [ ] Milestone 1.2 — Rotation, progression, and lifecycle
        - [ ] T-008 — Integrate clockwise counterclockwise rotation and wall kicks
            Depends on: T-007; milestone 1.1 complete and closed.
            Scope: C1/C3 rotation transitions and C4/C5 discrete rotation mapping; relevant unit/browser tests.
            Acceptance/evidence: R01/R09/A1: both directions, four-turn restoration, exact candidate priority, I/O behavior, wall/stack/floor rejection, no grounded timer reset and no native-repeat retrigger.
        - [ ] T-009 — Implement scoring levels and gravity progression
            Depends on: T-008.
            Scope: C3 progression module and transition integration; score/level view output and focused browser regression.
            Acceptance/evidence: R04/R05/A3/A4: 1–4 line point table, pre-clear multiplier, line/level thresholds, soft-drop points/rejection, new-piece speed and 80 ms floor. Keep prior board/rotation behavior green.
        - [ ] T-010 — Implement pause inactive-window handling and resource disposal
            Depends on: T-009.
            Scope: C3 lifecycle plus C5/C7 event/time ownership and lifecycle buttons; controlled scheduler/browser scenarios.
            Acceptance/evidence: R02/R09/R10/A7: pause/resume boundaries, native button keyboard semantics, blur/visibility pause without automatic resume, no catch-up or carried held keys, restart without duplicate loops/listeners, disposal and post-disposal events. Document lifecycle behavior.
        - [ ] T-011 — Review test and report milestone 1.2
            Depends on: T-008, T-009, T-010; all constituent task issue closures verified.
            Scope/evidence: separate code review of milestone capability and dependencies, required tests/regressions and PLAN exits, blocker repairs, truthful usability/function demonstration and findings/TODO disposition. Report: `docs/dev/reports/phases/1/1.2.md`. Refresh HANDOFF in the same checked-review-task commit; publish, close/read back review issue, then milestone.
            SPEC trace: the milestone delivery contracts above and [PLAN](PLAN.md) exits.
    - [ ] Milestone 1.3 — Hold and landing controls
        - [ ] T-012 — Implement once-per-piece hold and queue-safe swaps
            Depends on: T-011; milestone 1.2 complete and closed.
            Scope: C3 hold transitions and C5/C6 hold action/status/preview; unit and native browser scenarios.
            Acceptance/evidence: R02/R03/R06/A2/A5: empty/populated hold, exact queue consumption, orientation/time reset, rejected second hold, reset after lock, hold top-out and inactive lifecycle no-ops.
        - [ ] T-013 — Implement shared landing projection and ghost rendering
            Depends on: T-012.
            Scope: C1/C3 ghost snapshot derivation and C6 rendered ghost; engine/browser scenarios.
            Acceptance/evidence: R07/A6: maximal valid descent, uneven stacks, no penetration, changes after move/rotation/hold/lock, overlap hiding and distinct ghost/active pixels. Renderer consumes engine coordinates.
        - [ ] T-014 — Implement immediate-lock hard drop and drop scoring
            Depends on: T-013.
            Scope: C3 hard-drop transition and C4/C5 Space mapping; focused unit/browser scenarios.
            Acceptance/evidence: R05/R08/R09/A6: ghost/drop landing equality, zero/nonzero-distance immediate locking, drop points plus clear/level ordering, top-out and hold interactions, and one fresh Space press cannot drop successive pieces.
        - [ ] T-015 — Review test and report milestone 1.3
            Depends on: T-012, T-013, T-014; all constituent task issue closures verified.
            Scope/evidence: separate code review of milestone capability and dependencies, required tests/regressions and PLAN exits, blocker repairs, truthful usability/function demonstration and findings/TODO disposition. Report: `docs/dev/reports/phases/1/1.3.md`. Refresh HANDOFF in the same checked-review-task commit; publish, close/read back review issue, then milestone.
            SPEC trace: the milestone delivery contracts above and [PLAN](PLAN.md) exits.
    - [ ] Milestone 1.4 — Browser usability and delivery
        - [ ] T-016 — Complete deterministic held-key repeat and input eligibility
            Depends on: T-015; milestone 1.3 complete and closed.
            Scope: C4 keyboard policy and C5 scheduling/eligibility; pure timing and native browser tests.
            Acceptance/evidence: R09/R10/A7: immediate action, 150 ms delay/50 ms repeat, both-horizontal priority/release, soft-drop ordering, discrete-repeat suppression, editable/button eligibility, preventDefault scope, keyup after focus change, 10 ms quanta and 100 ms frame clamp.
        - [ ] T-017 — Complete responsive rendering status and control guidance
            Depends on: T-016.
            Scope: C6 styles/view plus relevant C5 resize bindings and user control/rule documentation.
            Acceptance/evidence: R10/A8: next/hold/availability, score/level/lines, distinct lifecycle overlays, focus labels/status announcements, grid/ghost visibility, density/resize without state mutation, both desktop viewports and no horizontal clipping. Observe Canvas pixels/screenshots.
        - [ ] T-018 — Complete cross-engine interaction error and isolation acceptance
            Depends on: T-017.
            Scope: Browser scenarios and validated fixtures/harness; bounded integration repairs to their owning components.
            Acceptance/evidence: R01–R12/A1–A9: exercise cross-feature transitions, native buttons/keys, focus/visibility, startup failure, invalid inputs/fixtures and snapshot isolation. Run Chromium/Firefox/WebKit without unexplained skips; distinguish modeled tests from native delivery/render evidence. Report concrete gaps instead of claiming whole-browser coverage from unit tests.
        - [ ] T-019 — Verify reproducible static delivery and publish user guidance
            Depends on: T-018.
            Scope: Build/CI configuration, production smoke checks, root README and agent command guidance; relevant delivery scenarios.
            Acceptance/evidence: R12/A8/A9: npm ci from committed lockfile, strict checks/unit/browser/build commands, HTTP root/subdirectory smoke with relative/local assets, no shipped test harness/debug endpoint, ignored generated outputs, and documented observed platform limits. CI config runs checks only; inspect available run results and report any access limit separately. No release/tag/site deployment.
        - [ ] T-020 — Review test and report milestone 1.4
            Depends on: T-016, T-017, T-018, T-019; all constituent task issue closures verified.
            Scope/evidence: separate code review of milestone capability and dependencies, required tests/regressions and PLAN exits, blocker repairs, truthful usability/function demonstration and findings/TODO disposition. Report: `docs/dev/reports/phases/1/1.4.md`. Refresh HANDOFF in the same checked-review-task commit; publish, close/read back review issue, then milestone.
            SPEC trace: the milestone delivery contracts above and [PLAN](PLAN.md) exits.
    - [ ] Milestone 1.5 — Phase review
        - [ ] T-021 — Review test and report complete phase 1
            Depends on: milestones 1.1–1.4 complete with reports, exits and verified issue/milestone closures; does not depend on its own milestone closure.
            Scope/evidence: separate cross-milestone implementation code review; R01–R12/A1–A9 coverage; strict/unit/three-engine/browser-render/build/production smoke checks; resolve contract/exit violations and aggregate all deferred findings with options/provenance. Reports: `docs/dev/reports/phases/1/PHASE-REPORT.md` and `docs/dev/reports/IMPLEMENTATION-REPORT.md`. Refresh HANDOFF with integration readiness in the same completion commit, publish and close issue/milestone, then perform the authorized full-phase integration and merged-state verification.
            Stop: full phase completion does not authorize release publication or a new feature campaign. A narrower selected range stops at its own boundary without completing extra review tasks or merging a partial phase.
