# Tetris component decomposition

## Ownership model

This model refines [ARCHITECTURE](ARCHITECTURE.md) within the accepted [PROJECT](PROJECT.md). Components are logical responsibilities; layout defines their physical homes. SPEC owns exact behavior and error contracts.

| ID / component | Responsibility and provided boundary | Dependencies and exclusions | Verification seam |
| --- | --- | --- | --- |
| C1 Geometry | Tetromino cells/rotation, candidate placement, collision checks, landing projection, and ordered kick candidates | Board and piece values; no timers, scoring, randomization, or DOM | Pure placement/rotation/landing fixtures |
| C2 Bag | Draw a permutation of seven pieces; refill and maintain the upcoming sequence | Injected random sample function; no view or score | Controlled samples, permutation and refill properties |
| C3 Engine | Own session state; process actions and active elapsed time; perform spawn, hold, lock, clear, score/level, and lifecycle transitions; return isolated snapshots | C1, C2; no browser APIs, asynchronous work, storage, or network | Explicit time/randomness and validated initial-state fixtures |
| C4 Keyboard policy | Normalize physical key codes, maintain held movement keys, and emit discrete/repeated actions in deterministic order | Plain key-event values and elapsed time; no engine mutation, native listeners, or rendering | Keydown/up and elapsed-time sequences |
| C5 Controller | Bind native events/buttons, advance keyboard policy and engine, render snapshots, manage visibility/focus and animation scheduling, and dispose resources | C3, C4, C6; injected browser scheduling/time seams for controller tests | Fake scheduler for unit checks; real events in browser tests |
| C6 View | Draw settled/active/ghost cells; present next/hold, score/level/lines, lifecycle and control help; expose semantic buttons/status | Snapshot data and Canvas/DOM; no placement calculations, point awards, or random draws | Snapshot-to-view checks, screenshots, Canvas pixel observations |
| C7 Composition | Create one application, wire production adapters, mount it, report fatal initialization failure, and expose disposal to its owner | C3–C6 and root element; no gameplay policy | Production startup/build smoke; isolated test harness startup |

## Engine state and transitions

C3 owns one settled board, an optional active piece, held piece and hold-use flag, upcoming sequence, score, total cleared lines, level, gravity/grounded timing, and lifecycle. C2's remaining bag belongs to that session, never to a module-global singleton. C1 derives ghost/landing information from the same board and active piece used for movement and locking.

The engine boundary provides session creation, action dispatch, elapsed-time advancement, restart, and snapshot retrieval. It copies input fixtures and exposes snapshots without shared mutable rows, piece coordinates, or queue arrays. A fixture initializer validates board dimensions, cell/piece values, active placement, counters, timers, and lifecycle consistency before use. Production composition supplies randomness and a fresh session; fixture injection is for deterministic tests and does not create a browser debug interface.

Each accepted engine call is atomic from a consumer's perspective. Lock writes active cells once, removes complete rows simultaneously, updates counters/score/level, then consumes the queue to spawn and checks game over. SPEC defines the exact sequence and priority when an action, timer expiry, or top-out coincide. A rejected movement/rotation must preserve state, including scoring and timers except for independent elapsed-time advancement.

## Keyboard and scheduling collaboration

C5 receives native keyboard events and passes their code and event kind to C4. C4 outputs engine actions; C5 decides when gameplay input is eligible and dispatches them. C4 ignores browser-generated repeat for discrete actions and implements movement repeat from explicit elapsed time. Releasing keys, pausing, losing focus, or disposing clears pending repeats.

C5 owns one animation loop and a monotonic frame baseline. It advances keyboard policy and the engine in a documented order, renders the resulting snapshot, and schedules the next frame. Paused/ready/game-over state can still render without advancing game simulation. Visibility/focus loss and explicit pause use the engine lifecycle boundary; resuming establishes a fresh frame baseline.

Restart resets engine session and held keys. It does not remount the page or add another event subscription. Disposal cancels animation and removes all controller-owned listeners and button handlers; subsequent input cannot advance the disposed application.

## Rendering and initialization failures

C6 receives engine-derived ghost coordinates and previews; it does not simulate drops or infer hold availability. It owns resize/density handling for the board and communicates status through HTML text. Controls and overlays remain in HTML so keyboard focus and accessible labels do not depend on pixels.

C7 verifies the mount and Canvas 2D capability before starting the loop. Fatal initialization errors stop startup and present a readable error in the application root where possible. C3 rejects invalid API values before changing session state. Blocked in-game moves remain normal no-op results. SPEC owns exact rejection/error guarantees.

## Integration and test boundaries

Unit tests target C1/C2/C3/C4 directly. Controller tests use a controlled scheduler and real engine with deterministic inputs. Browser tests mount the actual C7/C5/C6 application and use native browser automation for keys, buttons, focus and visibility. An E2E-only harness composes validated C3 fixtures for line-clear, hold/top-out and timing scenarios; its assets are excluded from production output.

Cross-component tests verify that time/order, repeat cancellation, restart/disposal, snapshot isolation and ghost placement remain consistent. Installation probes establish browser launch/session/render capability separately from application acceptance. No component requires an independent service, generic event bus, persistence abstraction, or extension framework.
