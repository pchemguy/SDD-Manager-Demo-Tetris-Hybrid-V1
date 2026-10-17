# Tetris specification

## Scope and ownership

The complete initial game satisfies [PROJECT](PROJECT.md), [ARCHITECTURE](ARCHITECTURE.md), and [DECOMPOSITION](DECOMPOSITION.md). C1–C7 refer to those logical components. These contracts define a project-specific ruleset, without an official Tetris Guideline conformance claim. All requirements apply to the completed initial version; PLAN may stage intermediate capabilities.

## R01 — Board, pieces, rotation, and placement

C1/C3 use a 10-column, 20-row settled board. Coordinates increase rightward and downward from (0,0); there are no hidden rows. Cells are empty or one of I, O, T, J, L, S, Z. An active piece is separate from settled cells. Every occupied cell of an accepted placement lies inside the board and overlaps no settled cell.

Spawn geometry uses these occupied local coordinates and square sizes:

| Piece | Square size N | Spawn cells (x,y) |
| --- | --- | --- |
| I | 4 | (0,1), (1,1), (2,1), (3,1) |
| O | 2 | (0,0), (1,0), (0,1), (1,1) |
| T | 3 | (1,0), (0,1), (1,1), (2,1) |
| J | 3 | (0,0), (0,1), (1,1), (2,1) |
| L | 3 | (2,0), (0,1), (1,1), (2,1) |
| S | 3 | (1,0), (2,0), (0,1), (1,1) |
| Z | 3 | (0,0), (1,0), (1,1), (2,1) |

Spawn orientation is zero with origin (floor((10−N)/2),0). Clockwise rotation maps each local cell (x,y) to (N−1−y,x); counterclockwise maps it to (y,N−1−x). Apply each step to the current orientation. O rotation is an unchanged no-op.

For every non-O rotation, test translated candidate origins in this order: (0,0), (−1,0), (+1,0), (−2,0), (+2,0), relative to the current origin. Accept the first valid candidate or reject the rotation unchanged. This horizontal wall-kick policy applies to I and the size-3 pieces; it has no vertical/floor kicks and is not SRS. Horizontal movement requests exactly one column and is rejected unchanged when blocked.

## R02 — Session lifecycle and queue

C3 starts in `ready` with empty board, score/lines zero, level one, empty hold, no active piece, and a visible next piece. Start creates an active spawn and enters `running`. Start outside ready is a no-op. Restart from any non-disposed application state creates a fresh running session with those counters reset, fresh bag/queue, empty hold, and no carried timing or held input. Restart does not reproduce a prior random sequence unless a test explicitly supplies the same fresh random source.

A lock or hold that requests a spawn overlapping settled cells causes `game-over` with no active/ghost piece. Settled cells and earned counters remain visible. No other top-out rule is used. Gameplay actions and elapsed time do not change ready, paused, or game-over sessions. Pause toggles running/paused; outside those states it is a no-op.

## R03 — Seven-bag randomization

C2 shuffles [I,O,T,J,L,S,Z] using descending Fisher–Yates: for i=6 through 1 choose j=floor(random()×(i+1)), then swap positions i and j. Draw from index zero toward six, refilling after exhaustion. Every bag contains each identifier exactly once; concatenated bags may repeat across their boundary. The application displays one next-piece preview, corresponding to the next queue draw.

An empty hold or ordinary post-lock spawn consumes exactly one queue piece; a held-piece swap consumes none. Tests inject deterministic samples. Production randomness uses Math.random through composition. Each sample must be finite and in [0,1); invalid samples raise RangeError without partial engine-state mutation. The caller's random source itself is not rewound.

## R04 — Time, gravity, and grounded locking

C3 advances only from explicit finite, nonnegative elapsed milliseconds; invalid elapsed values raise RangeError before mutation. Zero elapsed is a no-op. Gravity interval is max(80,floor(1000×0.85^(level−1))) milliseconds. A fresh spawn starts its gravity accumulator at zero. Each full interval attempts one downward cell; a successful downward step resets that accumulator. Successful soft drop also resets gravity timing.

A piece is grounded when one further downward cell would be invalid. The grounded timer starts at zero immediately on first contact, including contact produced by an input action. After 500 ms of continuously grounded running time the piece locks. Horizontal movement or rotation that remains grounded does not reset this timer. Becoming airborne clears grounded time and resets gravity timing. Paused/hidden time never advances either timer. There is no grounded movement-reset allowance.

Process elapsed time chronologically through gravity events, contact, lock, clear, and spawn. At equal event times, lock expiry has priority over a gravity attempt. Time remaining after a lock advances the next piece, unless game over occurs. At the exact 500 ms contact boundary the old piece has locked; at 499 ms it remains active. Hard drop follows R08's explicit immediate-lock policy.

## R05 — Lock, line clear, scoring, and levels

C3 locks four active cells once, finds every full row, removes those rows simultaneously, and prepends the same number of empty rows. Relative order of retained rows is preserved. Update score/lines/level, reset hold eligibility, then spawn the next queued piece. No overlap or partial row removal is permitted.

| Rows cleared in one lock | Base points |
| --- | --- |
| 0 | 0 |
| 1 | 100 |
| 2 | 300 |
| 3 | 500 |
| 4 | 800 |

Line-clear points equal base points times the level immediately before that clear. Total cleared lines increases by the removed row count; level equals 1+floor(total lines/10). The next piece uses the resulting level's gravity interval. A successful soft-drop cell adds one point; a rejected soft drop adds none and does not force locking. Hard drop adds two points per descended cell, including zero for a zero-distance drop. No combo, T-spin, or back-to-back score applies. Score and counters are nonnegative integers.

## R06 — Hold

C3 allows hold once per active piece between locks. An empty hold stores the current identifier and spawns the next queued piece; a populated hold swaps identifiers and spawns the held piece without consuming the queue. The spawned piece always uses spawn orientation/origin with fresh gravity and grounded timers. The hold is marked used even after an empty-hold spawn; another hold is rejected until the current piece locks. Hold awards no drop points. A colliding hold spawn follows R02 game over. Ready/paused/game-over hold is a no-op.

## R07 — Ghost projection

C1/C3 compute the maximal nonnegative downward translation of the active placement that remains valid. That landing placement is the ghost and is also the destination used by hard drop. The ghost never passes through settled cells. It updates after movement, rotation, descent, hold, lock, or restart; it is absent without an active piece. It is hidden visually when its cells exactly equal active cells. C6 draws a distinguishable outline/translucent ghost behind the solid active piece without altering engine state.

## R08 — Hard drop

C3 moves the active piece directly to R07's landing, awards R05 drop points, and locks immediately in the same action, including at zero distance. Clearing, scoring/level updates, spawn, and top-out follow R05/R02. Browser key-repeat cannot hard-drop a second piece from the same held Space key; a fresh press is required. Paused/ready/game-over hard drop is a no-op.

## R09 — Keyboard and simulation scheduling

C4/C5 use physical KeyboardEvent.code values:

| Input | Action |
| --- | --- |
| ArrowLeft / ArrowRight | Move one column; held movement repeats |
| ArrowDown | Soft drop one cell; held soft drop repeats |
| ArrowUp or KeyX | Rotate clockwise once per fresh press |
| KeyZ | Rotate counterclockwise once per fresh press |
| KeyC or ShiftLeft / ShiftRight | Hold once per fresh press |
| Space | Hard drop once per fresh press |
| KeyP or Escape | Toggle pause once per fresh press |
| Enter | Start when ready; no-op otherwise |

Start, pause/resume, and restart also have labelled HTML buttons. Restart is provided by its button only. Discrete actions ignore native repeat; C4 records press/release so a key held across a spawn cannot retrigger a discrete action. Movement/soft drop act immediately on press, wait 150 ms, then repeat every 50 ms. With both horizontal keys held, the most recently pressed takes priority; releasing it activates the remaining key immediately and restarts its repeat delay. Repeated horizontal movement precedes repeated soft drop at the same simulation boundary.

Gameplay shortcuts apply when focus is the game surface/root, not an unrelated editable element or a lifecycle button. Handled game keys prevent browser scrolling/default activation only in that context. Keyup clears held state even after focus changes. Native Enter/Space activation of a focused button retains ordinary button semantics and does not also dispatch a gameplay action.

C5 uses one requestAnimationFrame loop with a monotonic baseline, an elapsed-time accumulator, and 10 ms simulation quanta. Each quantum emits due held-key actions, then advances C3 by 10 ms. Native discrete input dispatches synchronously before a subsequent quantum. Clamp each frame's contributed elapsed time to 100 ms; discard excess stall time rather than replaying a long catch-up. Rendering occurs after the available quanta. Reset baseline, fractional accumulator, and held keys on pause, resume, restart, focus loss, visibility loss, and disposal.

## R10 — Browser lifecycle and presentation

C5 pauses a running session on document visibility loss or window focus loss. Showing/refocusing never resumes automatically; the user uses Resume/P/Escape. Ready and game-over remain unchanged. No time or input repeats accumulate while inactive. Disposal cancels the loop, removes all owned listeners/handlers, and makes subsequent events ineffectual. Repeated restart never duplicates subscriptions or loops.

C6 shows score, level, total cleared lines, next piece, held piece/empty state, hold availability, lifecycle, and control help. Ready, paused, and game-over states are visibly distinct. Buttons have accessible names and visible keyboard focus; concise lifecycle updates use a polite status announcement. The Canvas has a meaningful accessible label; full nonvisual gameplay is not claimed.

Render settled cells, active cells, and ghost distinctly with a visible grid/board edge. Resize and device-pixel-density changes preserve board proportions and do not change game state. At 1280×720 and 1024×768 desktop viewports, board and lifecycle controls are usable without horizontal clipping; vertical page scrolling is allowed. Narrow desktop layouts may stack panels. Test Canvas output as rendered pixels/screenshots as well as DOM status. All runtime assets are local to the static build; no network request is required during play after initial assets load.

## R11 — Engine API and initialization errors

C3 exposes actions, elapsed time, restart, and isolated snapshots through the composition boundary. Action values outside the documented action union are rejected with TypeError before mutation. Snapshot/fixture arrays must not alias authoritative state. A supplied fixture must have exactly 20×10 valid cells, valid piece identifiers/orientations, integer nonnegative score/line counts and a level consistent with lines, nonnegative valid timers, and lifecycle-consistent active/hold state. An active placement must be valid. Reject an inconsistent fixture with RangeError before creating a session. Grounded time is zero for an airborne active piece; game-over/ready has no active piece.

Fixture validation has these explicit bounds: active origin coordinates are integers; orientation is an integer 0–3 (O uses zero); all counters are safe integers; gravity elapsed is finite and in [0,current gravity interval); grounded elapsed is finite and in [0,500). Running/paused requires a valid active piece. Ready requires empty board/hold, no active piece, hold-used false, zero score/lines/timers and level one. Any no-active-piece state has zero timers. The hold-used flag is boolean and a held identifier is null or a valid piece. Stable fixture boards contain no already-full row: full rows are transient within an atomic lock/clear transition, and permitting them at initialization could produce an undefined greater-than-four-line clear. Pure row-removal helper tests may still pass full rows directly to that helper.

The fixture initializer can supply board, active placement, hold state, counters, lifecycle and timers only. Bag/queue state is created through R03 with injected randomness and cannot be overridden through fixtures. Contrived fixture active pieces need not be reachable through that fresh queue; ordinary fresh-session bag guarantees are tested without fixture overrides. Copy supplied arrays and reject malformed or unsupported fixture fields rather than treating fixtures as a saved-state import format. The fixture initializer is an internal testing/composition seam, not user-importable saved-game functionality.

C7 fails cleanly if mounting or Canvas 2D initialization is unavailable: render a readable initialization error where a root exists, schedule no loop, and leave no partial event subscriptions. Programmer errors are distinguishable from blocked gameplay actions, which are no-ops. Browser test fixtures are hosted only in an isolated harness excluded from production output; no test-only global or state mutation endpoint is shipped.

## R12 — Build, compatibility, and acceptance

The static production build must load over HTTP at root and at a subdirectory with relative assets. Developer instructions use npm commands compatible with Windows CMD without a PowerShell requirement. Pin actual compatible tooling in package-lock during implementation; document the Node requirement and browser installation steps from observed results. Product source uses strict TypeScript. No browser/account data is persisted.

Required browser acceptance targets Playwright Chromium, Firefox, and WebKit. Actual binaries, launch/session capability, Canvas rendering, and suite lifecycle must be demonstrated; installation alone is insufficient. A missing engine or failing required check is a blocker unless the human explicitly changes the requirement. Headless engines do not prove every branded browser or native Windows installation works; report that limit.

| Acceptance group | Required evidence at completed-version verification |
| --- | --- |
| A1 Placement and rotation | Spawn fixtures for all seven pieces; four rotations restore shape; ordered wall kicks; blocked/edge/floor cases preserve valid state |
| A2 Bag and preview | Deterministic shuffle, each seven-draw bag is a permutation, refill boundaries, and preview matches actual subsequent spawn |
| A3 Falling and locking | Gravity boundaries, soft-drop points, contact at 499/500 ms, no grounded reset, lift-off reset, and chronological multiple-event advancement |
| A4 Clear and progression | Simultaneous 1–4 row removal, retained row ordering, pre-clear level multiplier, threshold progression, and speed floor |
| A5 Hold and top-out | Empty and occupied hold, once-per-piece limit, reset after lock, orientation/timing reset, queue consumption, and colliding spawn |
| A6 Ghost and hard drop | Landing correspondence on uneven stacks, no penetration, ghost overlap hiding, immediate zero/nonzero-distance lock and scoring, and held Space cannot drop the next piece |
| A7 Input and lifecycle | Repeat/priority/release order, button keyboard semantics, pause/resume, blur/visibility pause, no catch-up, restart/disposal without duplicate work |
| A8 Browser and delivery | Three-engine native-event scenarios and rendered board/status checks, initialization failure, target viewports, production root/subdirectory smoke, relative/local assets and harness exclusion |
| A9 Isolation and errors | Snapshot/fixture copying, invalid values and fixture rejection, no partial mutation, and no shipped debugging surface |

Unit and browser tests must cover important interactions, not only isolated happy paths. Tests may use validated deterministic fixtures through the isolated harness. Verification reports distinguish planned, exercised, blocked, and omitted conditions; no gameplay acceptance is claimed during documentation preparation.
