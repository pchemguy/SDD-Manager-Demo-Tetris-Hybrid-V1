# Tetris delivery plan

## Delivery objective and authority

Deliver the complete [SPEC](SPEC.md) capability set as one initial version. The [architecture](ARCHITECTURE.md) and [component model](DECOMPOSITION.md) guide bounded increments. Intermediate milestones demonstrate useful subsets; none is the completed initial release until all contracts and phase exits pass.

Documentation preparation is separate from implementation Phase 1. The documentation checkpoints and integration are preapproved. This plan does not select an implementation range, activate phase tracking, authorize release publication, or claim working software.

## Phase 1 — Complete browser Tetris

The phase contains four delivery milestones followed by one dedicated phase review milestone. Implement in order, retaining the usable path and regression evidence at each boundary.

| Milestone | Outcome and included scope | Prerequisites | Exit evidence and intended decision |
| --- | --- | --- | --- |
| 1.1 Playable falling-block core | Establish compatible tooling/browser capability; geometry and seven-bag; start/restart, movement, soft descent, gravity/contact lock, line removal/top-out; render and control an actual game | Accepted/published preparation and verified phase projection before execution | Engine boundary fixtures and native browser move/drop/lock/clear scenarios; observed Canvas output and start/restart; demonstrate a playable loop to inform continue/amend/simplify/stop |
| 1.2 Rotation, progression, and lifecycle | Add rotation/horizontal kicks, score/levels/speed, pause/resume and inactive-window handling without duplicate loops/listeners | 1.1 complete and closed | Regress core; verify kick order, scoring thresholds, 499/500 ms locking, pause/focus timing and restart/disposal; demonstrate coherent pacing and lifecycle |
| 1.3 Hold and landing controls | Add once-per-piece hold, correct queue/swap/top-out behavior, ghost and immediate-lock hard drop with shared landing/scoring | 1.2 complete and closed | Hold/queue and ghost/drop interaction tests, uneven-stack/zero-distance/top-out cases, and actual key-triggered browser scenarios; demonstrate all requested gameplay capabilities |
| 1.4 Browser usability and delivery | Complete controlled repeat, button/focus semantics, responsive/status/help rendering, full cross-engine acceptance, and reproducible static build/user guidance | 1.3 complete and closed | Three-engine native-event and Canvas checks, both target viewports, error/isolation scenarios, production root/subdirectory smoke and harness exclusion, clean install/build guidance; assess initial-version usability and delivery readiness |
| 1.5 Phase review | Review complete implementation, interactions, exits, evidence and remaining findings; produce phase and final implementation reports | Every delivery milestone complete/closed; 1.5 remains open until its own review finishes | Separate whole-boundary code review and required test/build checks; zero unresolved contract/exit violation; final TODO aggregation and integration readiness |

## Earliest useful increment and honest deferrals

Milestone 1.1 ends with a game that starts, moves, descends, locks, clears rows, spawns subsequent pieces, ends on a blocked spawn, and restarts through the real browser application. The tooling prerequisite is necessary to establish repeatable execution and browser/Canvas capability before claims about those paths. It must remain bounded and cannot become an open-ended infrastructure project.

The early slice defers rotation actions, score/level progression, pause/focus lifecycle, hold, ghost, hard drop, custom key repeat, and final usability/build acceptance to their named subsequent milestones. The finished initial version still requires all of them. Seven-bag is included early so subsequent spawn/hold tests use the intended source consistently. Each increment preserves applicable existing behavior and documents its current scope truthfully.

## Contract coverage and integration route

| SPEC contracts | Delivery route |
| --- | --- |
| R01 geometry/placement | 1.1 geometry; 1.2 rotation and kicks; regress at 1.3/1.4 |
| R02 lifecycle/queue | 1.1 start/restart/spawn/top-out; 1.2 pause/focus; 1.3 hold top-out |
| R03 bag | 1.1 bag/preview and deterministic fixtures; 1.3 hold consumption |
| R04 timing | 1.1 explicit time/contact lock; 1.2 speed and lifecycle; 1.3 hard-drop exception; 1.4 frame/repeat integration |
| R05 scoring/clears | 1.1 row removal; 1.2 points/thresholds/speed; 1.3 hard-drop points |
| R06 hold | 1.3 engine and browser integration |
| R07–R08 ghost/drop | 1.3 shared landing, immediate lock and scoring; regress hold/spawn |
| R09 input/scheduling | 1.1 native basic input/loop; 1.2 rotation/pause; 1.3 discrete hold/drop; 1.4 repeat, button eligibility and timing integration |
| R10 lifecycle/view | 1.1 board/status shell; 1.2 inactive/pause/dispose; 1.4 resize, density, help, accessible controls and visibility evidence |
| R11 errors/isolation | Engine/geometry/bag validation in 1.1; integration and startup failure in 1.4; regress per changed boundary |
| R12 / A1–A9 | Establish runnable checks in 1.1; expand during each milestone; complete matrix/build/isolation evidence in 1.4; aggregate in 1.5 |

Components integrate through the engine action/snapshot boundary early. Controlled time/randomness fixtures enable edge-state testing without adding product debug surfaces. Add browser regressions with each integrated capability; do not postpone all browser testing to 1.4. Every delivery task includes its relevant tests and module/user documentation.

## Review, persistence, and completion gates

Every delivery milestone ends with an explicit code review/testing/report task. Review its whole capability and relevant dependents separately from executing tests, fix bugs and all SPEC/PLAN violations, run affected regressions, commit its report and HANDOFF update with its checked task, publish/read back, then close its issue and milestone. Implementation milestone reports use `docs/dev/reports/phases/1/<milestone-id>.md`.

Milestone 1.5 contains exactly one phase review/testing/report task. It depends on completion and verified closure of all four delivery milestones, not on its own closure. It aggregates final findings/TODOs, writes `docs/dev/reports/phases/1/PHASE-REPORT.md` and `docs/dev/reports/IMPLEMENTATION-REPORT.md`, refreshes HANDOFF, and verifies the phase exits. Only eligible non-critical code concerns consistent with contracts/exits may be deferred with options, rationale, provenance and follow-up ownership. Required failures/blockers cannot be listed as acceptable TODOs.

Implementation commits close exactly one task with result/evidence and initial checkbox together; publish/read back before advancing. Track only an eligible authorized phase and verify all its label/milestone/task associations before the first implementation task. A partial selected range pushes and pauses on its phase branch. A complete authorized phase integrates through an explicit two-parent merge into its recorded main parent, followed by merged-state checks and target publication. A phase merge is not a release/tag/site-publication request.

## Risks and exit limits

- Dependency/native browser availability: establish exact compatible versions, launch/session/rendering evidence and clean-install reproducibility in the environment task. Recover actual blockers within scope; required unavailable evidence blocks affected execution.
- Timing and input: test deterministic event boundaries and native delivery; distinguish fake-scheduler tests from browser behavior. Do not silently waive background/focus or key-repeat contracts.
- Canvas: inspect actual rendered output, DPI/resize and overlays; engine fixtures alone do not prove presentation.
- Fixture leakage: keep deterministic browser harness isolated and verify production assets contain no test entry or debug mutation surface.
- Platform claims: document tested Linux/headless engines and shell-portable CMD instructions accurately. No unperformed native Windows or branded-browser compatibility claim.

Phase completion requires all R01–R12/A1–A9 acceptance groups covered, strict TypeScript and relevant unit/browser suites passing without unexplained skips, production delivery checks passing, separate boundary code reviews, published task/review evidence, closed required issues/milestones, and verified phase integration. Missing or failed required evidence retains a blocked exit.
