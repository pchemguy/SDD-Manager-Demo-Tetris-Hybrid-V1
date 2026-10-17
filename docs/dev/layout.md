# Tetris repository layout

## Status and allocation rules

This is the intended physical allocation for the accepted [architecture](ARCHITECTURE.md), [components](DECOMPOSITION.md), and [delivery plan](PLAN.md). Product source, tests, tooling, build outputs, and implementation reports below are planned paths, not claims that those files exist. The preparation documents and bundled agent guidance already exist.

Keep gameplay independent of browser modules. Production entry imports source only; browser harness entries live under tests and are excluded from production build inputs/output. Test fixtures may depend on engine types/functions; production modules must not import fixtures. Do not add parallel state, traceability, or issue registries.

## Component and check ownership

| Component / concern | Intended source home | Intended checks and allocation rationale |
| --- | --- | --- |
| Shared engine values | `src/game/types.ts` | Imported by gameplay/browser consumers; types have no runtime browser dependency |
| C1 piece geometry | `src/game/pieces.ts` | `tests/unit/pieces.test.ts`; canonical piece definitions, rotation, and ordered kick candidates |
| C1 board geometry | `src/game/board.ts` | `tests/unit/board.test.ts`; placement, landing and pure simultaneous row-removal helpers; C3 owns transition ordering |
| C2 seven-bag | `src/game/bag.ts` | `tests/unit/bag.test.ts`; deterministic samples, permutation and refill checks |
| C3 state and engine | `src/game/state.ts`, `src/game/engine.ts`, `src/game/progression.ts` | `tests/unit/state.test.ts`, `engine-*.test.ts`, `progression.test.ts`; state/fixture/snapshot validation, transition/time orchestration, and pure scoring/level calculations have separate homes |
| C4 keyboard policy | `src/browser/keyboard.ts` | `tests/unit/keyboard.test.ts`; plain code/key/timing values; no native subscriptions |
| C5 browser controller | `src/browser/controller.ts` | `tests/browser/lifecycle.spec.ts`, `controls.spec.ts`; native event/scheduling/resource ownership and controlled scheduler scenarios in a browser |
| C6 presentation | `src/browser/view.ts`, `src/styles.css` | `tests/browser/rendering.spec.ts`; Canvas/status/preview rendering, density/resize, focus styles and error display |
| C7 composition | `src/app.ts`, `src/main.ts`, `index.html` | `tests/browser/startup.spec.ts` and production smoke; app factory is composable, main owns production boot |
| Engine/browser scenario data | `tests/fixtures/` | Validated deterministic board/state/randomness helpers; no production imports |
| Browser-only harness | `tests/browser/harness/index.html`, `tests/browser/harness/main.ts` | Compose the real app with deterministic fixtures through controlled test setup; never an input to production build |
| Cross-feature acceptance | `tests/browser/gameplay.spec.ts`, `tests/browser/delivery.spec.ts` | Native input for rotations, clears, score/levels, hold/drop/ghost, error states, root/subdirectory builds and harness exclusion |

The listed test names reserve coherent areas rather than requiring an exhaustive one-file-per-scenario scheme. `engine-*.test.ts` may split timing, hold/drop, and lifecycle by contract without duplicating helpers. A task can add a focused sibling within the owning area when its responsibility is clear; a material ownership/dependency change requires a layout review.

## Tooling, outputs, and delivery

| Concern | Intended location and policy |
| --- | --- |
| Node package/scripts | `package.json`, `package-lock.json`; exact versions and shell-portable npm scripts established in environment setup |
| TypeScript/Vite/Vitest | `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`; strict source checks and explicit test/build entry selection |
| Playwright | `playwright.config.ts`; three engine projects, controlled web server and retained failure evidence |
| CI checks | `.github/workflows/checks.yml`; install from lockfile, run declared static/unit/browser/build checks; no deployment or release job |
| Production output | `dist/`; generated and ignored, built from production index with relative assets |
| Test output | `test-results/`, `playwright-report/`, `coverage/`; generated/ignored; reference relevant retained failure evidence in task/review reports |
| User guidance | Root `README.md`; scope/status, verified setup/check commands, controls, rules and observed support limits |
| Agent orientation | Root `AGENTS.md`; current document owners, HANDOFF, validated command navigation and workflow obligations |
| Hosting credential | Ignored, protected root `gh.tkn` beside `.gitignore`; no token bytes in tracked source, fixtures, reports or logs |

A distributable static build is produced by the build command; no generated bundle, site deployment, GitHub release, or tag is authored during preparation. Source and test modules receive concise responsibility-level documentation during implementation.

## Development records

Current governing owners are `docs/dev/PROJECT.md`, `ARCHITECTURE.md`, `DECOMPOSITION.md`, `SPEC.md`, `PLAN.md`, this `layout.md`, and the forthcoming `TASKS.md`. Preparation status/decisions remain in `DOCS_TASKS.md`; `HANDOFF.md` records workflow checkpoints. Adjacent SPEC/PLAN/TASKS review reports hold source identities and readiness. `DOCS-QC-REPORT.md` holds final package QC when produced.

Implementation milestone reports belong to `docs/dev/reports/phases/1/1.1.md` through `1.4.md`; phase review owns `docs/dev/reports/phases/1/PHASE-REPORT.md` and `docs/dev/reports/IMPLEMENTATION-REPORT.md`. Those paths do not exist merely because this layout reserves them. Workflow branches and integration follow the governing SDD instructions; layout does not allocate extra campaign artifacts.

Repository-provided skills/plugins remain under `.agents/`. Preserve their packaged contents during product work; they are workflow inputs, not implementation modules or a place for game code.
