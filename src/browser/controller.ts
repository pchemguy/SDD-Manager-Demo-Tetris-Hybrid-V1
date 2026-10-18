import type { GameEngine } from '../game/engine.ts';
import type { GameSnapshot } from '../game/types.ts';
import { isEligibleKeyboardTarget, mapKeyDownToAction } from './keyboard.ts';
import { createTetrisView, type TetrisView } from './view.ts';

/**
 * C5 Browser controller (Milestone 1.1 core: R09 / R10 / A7).
 * Binds native keyboard events and Start/Restart buttons, drives a single
 * requestAnimationFrame simulation loop with a 100 ms frame clamp and 10 ms
 * simulation quanta, renders snapshots, and disposes listeners/timers cleanly.
 */

export const SIMULATION_QUANTUM_MS = 10;
export const MAX_FRAME_DELTA_MS = 100;

export interface BrowserScheduler {
  now(): number;
  requestAnimationFrame(callback: (timestamp: number) => void): number;
  cancelAnimationFrame(handle: number): void;
}

export interface ControllerOptions {
  readonly root: HTMLElement;
  readonly engine: GameEngine;
  readonly scheduler?: BrowserScheduler;
}

export interface TetrisController {
  getSnapshot(): GameSnapshot;
  stepFrame(timestampMs: number): GameSnapshot;
  dispose(): void;
}

function createDefaultScheduler(win: Window): BrowserScheduler {
  return {
    now: () => (win.performance ? win.performance.now() : Date.now()),
    requestAnimationFrame: (cb) => win.requestAnimationFrame(cb),
    cancelAnimationFrame: (id) => win.cancelAnimationFrame(id),
  };
}

export function createTetrisController(options: ControllerOptions): TetrisController {
  const { root, engine } = options;
  const doc = root.ownerDocument;

  let disposed = false;
  let rafHandle: number | null = null;
  let lastFrameTimeMs: number | null = null;
  let accumulatedMs = 0;

  function resetLoopTiming(): void {
    lastFrameTimeMs = null;
    accumulatedMs = 0;
  }

  // Verify Canvas 2D and mount the view before attaching window listeners or scheduling (R11)
  const view: TetrisView = createTetrisView(root, {
    onStart(): void {
      if (disposed) return;
      const snap = engine.dispatch('start');
      resetLoopTiming();
      view.render(snap);
      view.shellElement.focus();
    },
    onRestart(): void {
      if (disposed) return;
      const snap = engine.restart();
      resetLoopTiming();
      view.render(snap);
      view.shellElement.focus();
    },
  });

  const win = doc.defaultView ?? (typeof window !== 'undefined' ? window : null);
  if (!win) {
    view.dispose();
    throw new Error('Browser window context is unavailable.');
  }
  const scheduler = options.scheduler ?? createDefaultScheduler(win);

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (disposed) {
      return;
    }
    if (!isEligibleKeyboardTarget(event.target)) {
      return;
    }
    const action = mapKeyDownToAction({ code: event.code, repeat: event.repeat });
    if (!action) {
      return;
    }
    event.preventDefault();
    if (action === 'start') {
      resetLoopTiming();
    }
    const snap = engine.dispatch(action);
    view.render(snap);
  };

  win.addEventListener('keydown', handleKeyDown);

  function advanceSimulationFrame(timestampMs: number): GameSnapshot {
    const current = engine.getSnapshot();
    if (current.lifecycle !== 'running') {
      lastFrameTimeMs = timestampMs;
      accumulatedMs = 0;
      view.render(current);
      return current;
    }

    if (lastFrameTimeMs === null) {
      lastFrameTimeMs = timestampMs;
      view.render(current);
      return current;
    }

    const rawDelta = Math.max(0, timestampMs - lastFrameTimeMs);
    lastFrameTimeMs = timestampMs;
    const clampedDelta = Math.min(MAX_FRAME_DELTA_MS, rawDelta);
    accumulatedMs += clampedDelta;

    while (accumulatedMs >= SIMULATION_QUANTUM_MS) {
      accumulatedMs -= SIMULATION_QUANTUM_MS;
      const afterQuantum = engine.advanceTime(SIMULATION_QUANTUM_MS);
      if (afterQuantum.lifecycle !== 'running') {
        accumulatedMs = 0;
        break;
      }
    }

    const updated = engine.getSnapshot();
    view.render(updated);
    return updated;
  }

  function onAnimationFrame(timestampMs: number): void {
    if (disposed) {
      return;
    }
    advanceSimulationFrame(timestampMs);
    rafHandle = scheduler.requestAnimationFrame(onAnimationFrame);
  }

  // Initial render and single loop schedule
  view.render(engine.getSnapshot());
  rafHandle = scheduler.requestAnimationFrame(onAnimationFrame);

  return {
    getSnapshot(): GameSnapshot {
      return engine.getSnapshot();
    },

    stepFrame(timestampMs: number): GameSnapshot {
      if (disposed) {
        return engine.getSnapshot();
      }
      return advanceSimulationFrame(timestampMs);
    },

    dispose(): void {
      if (disposed) {
        return;
      }
      disposed = true;
      if (rafHandle !== null) {
        scheduler.cancelAnimationFrame(rafHandle);
        rafHandle = null;
      }
      win.removeEventListener('keydown', handleKeyDown);
      view.dispose();
    },
  };
}
