# Tetris

A TypeScript browser-based Tetris game under development. The complete initial version includes a 10×20 board, seven tetrominoes, keyboard controls, scoring and levels, next-piece preview, pause/restart, hold, ghost projection, 7-bag randomization, wall kicks, and hard drop.

The [project brief](docs/dev/PROJECT.md) defines the accepted scope. Development uses [SDD Manager](SDD-MANAGER.md). See the [AI-assisted development disclosure](AI_DISCLOSURE.md).

This repository is part of the SDD Manager Demos project. The development conversation also made other plugins and skills available and contained context from earlier Tetris projects. Repository development records identify decisions and evidence for this project; availability of a tool or prior context does not establish that it was used or accepted here.

The [architecture](docs/dev/ARCHITECTURE.md), [specification](docs/dev/SPEC.md), [delivery plan](docs/dev/PLAN.md), and [implementation tasks](docs/dev/TASKS.md) define the intended implementation. The selected rules include horizontal wall kicks, a 500 ms grounded lock delay, and immediate locking on hard drop.

## Milestone 1.1 working subset and explicit deferrals

- **Active branch:** `phase/1-complete-browser-tetris` (`Milestone 1.1 — Playable falling-block core`).
- **Implemented in Milestone 1.1 (`T-001`–`T-006`):**
    - 10×20 board and all seven tetromino spawn geometries (`I`, `O`, `T`, `J`, `L`, `S`, `Z`), CW/CCW rotation transforms, ordered horizontal wall kicks `(0,0), (-1,0), (+1,0), (-2,0), (+2,0)`, and landing projection in C1 (`src/game/pieces.ts`, `src/game/board.ts`).
    - Deterministic descending Fisher–Yates 7-bag randomization and next-piece preview in C2 (`src/game/bag.ts`).
    - Session lifecycle (`ready`, `running`, `game-over`), start (`Enter` or **Start** button) and **Restart** button, horizontal movement (`ArrowLeft` / `ArrowRight`), soft drop (`ArrowDown`), explicit gravity accumulation (`1000 ms` at Level 1), 500 ms grounded lock delay, simultaneous 1–4 row clearing, next-piece spawn, and colliding-spawn `game-over` in C3–C7 (`src/game/state.ts`, `src/game/engine.ts`, `src/browser/`, `src/app.ts`).
    - HTML/Canvas 2D presentation with rendered settled and active cells, next-piece preview, lifecycle overlays, and isolated browser test harness (`tests/browser/harness/`, excluded from production `dist/`).
- **Explicitly deferred to Milestones 1.2–1.4 (`PLAN.md`):**
    - **Milestone 1.2 (`T-008`–`T-011`):** In-game CW/CCW rotation key dispatch (`ArrowUp`/`KeyX`, `KeyZ`), line-clear and soft-drop scoring, 10-line level thresholds and gravity speed progression, pause/resume (`KeyP`/`Escape`/button), inactive-window blur/visibility auto-pause, and full listener/loop disposal scenarios.
    - **Milestone 1.3 (`T-012`–`T-015`):** Once-per-piece hold (`KeyC`/`ShiftLeft`/`ShiftRight`), rendered ghost piece projection, and immediate-lock hard drop (`Space`) with drop scoring.
    - **Milestone 1.4 (`T-016`–`T-020`):** Custom 150 ms / 50 ms held-key movement repeat and priority, responsive/device-pixel-ratio resize handling across target viewports, complete cross-feature acceptance matrix, and reproducible static HTTP root/subdirectory smoke verification.

## Validated environment and setup

Observed and verified on Windows (`cmd` shell, no PowerShell requirement):

- Node.js `v26.3.0`, npm `11.16.0`
- Pinned packages: `typescript@5.8.3`, `vite@8.3.4`, `vitest@5.0.5`, `@playwright/test@1.64.1`, `@types/node@26.6.5`
- Provisioned Playwright browser engines:
    - Chromium Headless Shell `156.0.8078.4` (`v1248`)
    - Firefox `157.0` (`v1555`)
    - WebKit `27.2` (`v2370`)

Note: Headless Playwright browser engines verify automated Chromium, Firefox, and WebKit rendering and session behavior; they do not prove every branded desktop browser installation or OS configuration works without separate testing.

### Setup and verification commands (CMD-compatible)

```cmd
npm ci
npx playwright install chromium firefox webkit
npm run typecheck
npm run test:unit
npm run test:browser
npm run build
npm run dev
```
