# Tetris

A TypeScript browser-based Tetris game under development. The first version includes a 10×20 board, seven tetrominoes, keyboard controls, scoring and levels, next-piece preview, pause/restart, hold, ghost projection, 7-bag randomization, wall kicks, and hard drop.

The [project brief](docs/dev/PROJECT.md) defines the accepted scope. Development uses [SDD Manager](SDD-MANAGER.md). See the [AI-assisted development disclosure](AI_DISCLOSURE.md).

This repository is part of the SDD Manager Demos project. The development conversation also made other plugins and skills available and contained context from earlier Tetris projects. Repository development records identify decisions and evidence for this project; availability of a tool or prior context does not establish that it was used or accepted here.

The [architecture](docs/dev/ARCHITECTURE.md), [specification](docs/dev/SPEC.md), [delivery plan](docs/dev/PLAN.md), and [implementation tasks](docs/dev/TASKS.md) define the intended implementation. The selected rules include horizontal wall kicks, a 500 ms grounded lock delay, and immediate locking on hard drop.

## Current status

- Active workflow branch: `phase/1-complete-browser-tetris` (implementing Milestone `1.1 — Playable falling-block core`).
- `T-001` establishes compatible tooling, browser engine capabilities, and the production application skeleton (`index.html`, `src/main.ts`, `src/app.ts`, `src/styles.css`). Bounded setup probes verify root/Canvas initialization and Canvas 2D pixel rasterization across Chromium, Firefox, and WebKit; they do not establish gameplay acceptance, which follows in `T-002`–`T-006`.

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
