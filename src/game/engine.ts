import { createSevenBagQueue, type SevenBagQueue } from './bag.ts';
import {
  createEmptyBoard,
  isPieceGrounded,
  isValidPlacement,
  tryTranslatePiece,
} from './board.ts';
import { createSpawnPiece } from './pieces.ts';
import {
  computeGravityIntervalMs,
  createReadySessionState,
  createSnapshot,
  isGameAction,
  validateAndCloneFixture,
  type InternalSessionState,
} from './state.ts';
import {
  LOCK_DELAY_MS,
  type EngineFixture,
  type GameAction,
  type GameSnapshot,
  type RandomSource,
} from './types.ts';

/**
 * C3 Game engine (T-004 slice: session state, horizontal/soft movement,
 * gravity accumulation, and grounded/airborne contact timing).
 * Full lock/clear/spawn/top-out transition orchestration completes in T-005.
 */

export interface EngineOptions {
  readonly random?: RandomSource;
  readonly fixture?: EngineFixture;
}

export interface GameEngine {
  dispatch(action: GameAction): GameSnapshot;
  advanceTime(elapsedMs: number): GameSnapshot;
  restart(random?: RandomSource): GameSnapshot;
  getSnapshot(): GameSnapshot;
}

export function createGameEngine(options: EngineOptions = {}): GameEngine {
  let randomSource: RandomSource = options.random ?? Math.random;
  // Validate fixture before creating session or consuming random source if provided
  let state: InternalSessionState = options.fixture
    ? validateAndCloneFixture(options.fixture)
    : createReadySessionState();
  let queue: SevenBagQueue = createSevenBagQueue(randomSource);

  function spawnFromQueue(): void {
    const nextId = queue.drawNext();
    const spawned = createSpawnPiece(nextId);
    state.gravityElapsedMs = 0;
    state.groundedElapsedMs = 0;
    if (!isValidPlacement(state.board, spawned.cells)) {
      state.activePiece = null;
      state.lifecycle = 'game-over';
      return;
    }
    state.activePiece = spawned;
    state.lifecycle = 'running';
  }

  function applyHorizontalMove(dx: -1 | 1): void {
    if (state.lifecycle !== 'running' || !state.activePiece) {
      return;
    }
    const wasGrounded = isPieceGrounded(state.board, state.activePiece);
    const moved = tryTranslatePiece(state.board, state.activePiece, dx, 0);
    if (!moved) {
      return;
    }
    state.activePiece = moved;
    const nowGrounded = isPieceGrounded(state.board, state.activePiece);
    if (wasGrounded && !nowGrounded) {
      // Becoming airborne clears grounded time and resets gravity timing (R04)
      state.groundedElapsedMs = 0;
      state.gravityElapsedMs = 0;
    } else if (!wasGrounded && nowGrounded) {
      // Grounded timer starts at zero immediately on first contact (R04)
      state.groundedElapsedMs = 0;
    }
    // If wasGrounded && nowGrounded, groundedElapsedMs is preserved (R04)
  }

  function applySoftDrop(): void {
    if (state.lifecycle !== 'running' || !state.activePiece) {
      return;
    }
    const moved = tryTranslatePiece(state.board, state.activePiece, 0, 1);
    if (!moved) {
      return;
    }
    state.activePiece = moved;
    state.gravityElapsedMs = 0;
    state.groundedElapsedMs = 0;
  }

  return {
    dispatch(action: GameAction): GameSnapshot {
      if (!isGameAction(action)) {
        throw new TypeError(`Unsupported game action "${String(action)}".`);
      }

      if (action === 'start') {
        if (state.lifecycle === 'ready') {
          spawnFromQueue();
        }
        return createSnapshot(state, queue.peekNext());
      }

      if (state.lifecycle !== 'running' || !state.activePiece) {
        return createSnapshot(state, queue.peekNext());
      }

      switch (action) {
        case 'move-left':
          applyHorizontalMove(-1);
          break;
        case 'move-right':
          applyHorizontalMove(1);
          break;
        case 'soft-drop':
          applySoftDrop();
          break;
        default:
          // Rotation, pause, hold, and hard-drop are integrated in subsequent tasks
          break;
      }

      return createSnapshot(state, queue.peekNext());
    },

    advanceTime(elapsedMs: number): GameSnapshot {
      if (typeof elapsedMs !== 'number' || !Number.isFinite(elapsedMs) || elapsedMs < 0) {
        throw new RangeError(`Elapsed time must be a finite nonnegative number; received ${String(elapsedMs)}.`);
      }
      if (elapsedMs === 0 || state.lifecycle !== 'running' || !state.activePiece) {
        return createSnapshot(state, queue.peekNext());
      }

      let remainingMs = elapsedMs;
      while (remainingMs > 0 && state.lifecycle === 'running' && state.activePiece) {
        const gravityIntervalMs = computeGravityIntervalMs(state.level);
        const timeToGravity = gravityIntervalMs - state.gravityElapsedMs;
        const grounded = isPieceGrounded(state.board, state.activePiece);
        const timeToLock = grounded ? LOCK_DELAY_MS - state.groundedElapsedMs : Number.POSITIVE_INFINITY;
        const nextEventMs = Math.min(remainingMs, timeToGravity, timeToLock);

        state.gravityElapsedMs += nextEventMs;
        if (grounded) {
          state.groundedElapsedMs += nextEventMs;
        }
        remainingMs -= nextEventMs;

        if (grounded && state.groundedElapsedMs >= LOCK_DELAY_MS) {
          // Full lock/clear/spawn orchestration is integrated in T-005
          break;
        }

        if (state.gravityElapsedMs >= gravityIntervalMs) {
          state.gravityElapsedMs = 0;
          const stepped = tryTranslatePiece(state.board, state.activePiece, 0, 1);
          if (stepped) {
            state.activePiece = stepped;
            state.groundedElapsedMs = 0;
          }
        }
      }

      return createSnapshot(state, queue.peekNext());
    },

    restart(newRandom?: RandomSource): GameSnapshot {
      if (newRandom !== undefined) {
        randomSource = newRandom;
      }
      const nextQueue = createSevenBagQueue(randomSource);
      queue = nextQueue;
      state = {
        lifecycle: 'running',
        board: createEmptyBoard(),
        activePiece: null,
        heldPiece: null,
        holdUsed: false,
        score: 0,
        lines: 0,
        level: 1,
        gravityElapsedMs: 0,
        groundedElapsedMs: 0,
      };
      spawnFromQueue();
      return createSnapshot(state, queue.peekNext());
    },

    getSnapshot(): GameSnapshot {
      return createSnapshot(state, queue.peekNext());
    },
  };
}
