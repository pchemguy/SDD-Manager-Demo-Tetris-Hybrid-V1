# Tetris project brief

Status: proposed for human review; DOCS-002 remains incomplete until first approval.

## Purpose and intended users

Build a single-player, browser-based Tetris game for people who want familiar falling-block gameplay with keyboard controls. The project also serves as a practical demonstration of specification-driven development using SDD Manager, with reviewable requirements, incremental delivery, automated tests, and GitHub tracking.

## Confirmed scope

The user selected TypeScript and confirmed that the first completed version includes the classic baseline and all five modern enhancements below. These enhancements belong to the initial project scope rather than a later feature campaign.

- A 10×20 playing board and all seven tetrominoes.
- Horizontal movement, rotation, soft drop, gravity, collision handling, piece locking, and line clearing.
- Score, levels, next-piece preview, pause, restart, and game over.
- Keyboard controls and automated gameplay tests.
- Hold piece, ghost piece, 7-bag randomization, wall kicks, and hard drop.

## Desired outcomes

- A playable game with responsive controls and understandable game status, controls, scoring, and upcoming/held pieces.
- Consistent gameplay rules across rendering and input paths, including correct interaction among hold, ghost projection, rotation, hard drop, and locking.
- Automated evidence for game rules and representative browser interactions, including game lifecycle and the requested enhancements.
- A maintainable TypeScript implementation with reproducible setup and checks documented from verified commands.
- Development records that distinguish proposed requirements, accepted decisions, implemented behavior, and actual verification.

## Proposed boundaries

The initial product targets desktop browsers with a physical keyboard. It runs as a client-side application without accounts, a server, or network access during play. Multiplayer, online leaderboards, touch controls, sound, configurable rules, and saved-game persistence are outside the proposed initial scope.

These boundaries are proposals for acceptance with this brief, not requirements supplied by the user. Development and dependency installation may require network access.

## Constraints and decisions to develop

TypeScript, browser delivery, and the confirmed capability set are established constraints. Repository guidance requires SDD Manager document checkpoints, per-commit publication, and GitHub documentation and implementation tracking; repository operations were explicitly authorized in the conversation.

ARCHITECTURE will propose the rendering approach, application structure, and development/test tooling. SPEC will propose exact scoring and progression, gravity and lock timing, rotation and wall-kick behavior, hold limits, spawn/top-out behavior, keyboard mapping and repeat, pause/focus handling, and supported browser checks. The brief does not claim conformance to an official Tetris ruleset.

No special locking policy or control mapping from another Tetris project is adopted without an explicit decision for this repository. No implementation is complete at this checkpoint.

## Development records

Development uses [SDD Manager](../../SDD-MANAGER.md). See the [AI-assisted development disclosure](../../AI_DISCLOSURE.md), [preparation task list](DOCS_TASKS.md), and [workflow checkpoint](HANDOFF.md).
