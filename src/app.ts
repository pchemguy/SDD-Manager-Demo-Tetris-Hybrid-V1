import { createTetrisController, type BrowserScheduler } from './browser/controller.ts';
import { createGameEngine, type EngineOptions } from './game/engine.ts';
import type { GameSnapshot } from './game/types.ts';

/**
 * C7 Application composition boundary (R10, R11, R12).
 * Wires C3 engine, C4 keyboard policy, C5 controller, and C6 view into the mounted
 * root element, reports fatal initialization failures cleanly, and exposes disposal.
 */

export interface TetrisAppOptions extends EngineOptions {
  readonly scheduler?: BrowserScheduler;
}

export interface TetrisAppInstance {
  getSnapshot(): GameSnapshot;
  dispose(): void;
}

export function createTetrisApp(
  root: HTMLElement | null,
  options: TetrisAppOptions = {},
): TetrisAppInstance {
  if (!root || typeof root.appendChild !== 'function') {
    throw new TypeError('Application root element is required to mount Tetris.');
  }

  const engine = createGameEngine({
    random: options.random,
    fixture: options.fixture,
  });

  const controller = createTetrisController({
    root,
    engine,
    scheduler: options.scheduler,
  });

  return {
    getSnapshot(): GameSnapshot {
      return controller.getSnapshot();
    },
    dispose(): void {
      controller.dispose();
    },
  };
}
