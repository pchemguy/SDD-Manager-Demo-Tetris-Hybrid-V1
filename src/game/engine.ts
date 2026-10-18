import { createSevenBagQueue, type SevenBagQueue } from './bag.ts';
import {
  clearFullRows,
  cloneBoard,
  createEmptyBoard,
  isPieceGrounded,
  isValidPlacement,
  lockPieceOnBoard,
  tryTranslatePiece,
} from './board.ts';
import { cloneActivePiece, createSpawnPiece } from './pieces.ts';
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
 * C3 Game engine (T-004 / T-005).
 * Owns session state, horizontal/soft movement, chronological gravity and
 * 500 ms grounded contact locking, simultaneous 1-4 row clearing, next-piece
 * spawning, and colliding-spawn game-over transitions (R02, R04, R05, R11).
 * Score/level progression on clears and drops is scoped to T-009.
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

function cloneInternalState(state: InternalSessionState): InternalSessionState {
  return {
    lifecycle: state.lifecycle,
    board: cloneBoard(state.board),
    activePiece: state.activePiece ? cloneActivePiece(state.activePiece) : null,
    heldPiece: state.heldPiece,
    holdUsed: state.holdUsed,
    score: state.score,
    lines: state.lines,
    level: state.level,
    gravityElapsedMs: state.gravityElapsedMs,
    groundedElapsedMs: state.groundedElapsedMs,
  };
}

export function createGameEngine(options: EngineOptions = {}): GameEngine {
  let randomSource: RandomSource = options.random ?? Math.random;
  let state: InternalSessionState = options.fixture
    ? validateAndCloneFixture(options.fixture)
    : createReadySessionState();
  let queue: SevenBagQueue = createSevenBagQueue(randomSource);

  function spawnNextFromQueue(): void {
    // Draw from queue before mutating state so a RangeError during bag refill
    // never leaves partial engine-state mutations (R03 / R11).
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

  function lockActivePiece(): void {
    if (!state.activePiece) {
      return;
    }
    const lockedBoard = lockPieceOnBoard(state.board, state.activePiece);
    const { board: clearedBoard, clearedLines } = clearFullRows(lockedBoard);
    // Draw next piece before mutating state so refill failure is atomic
    const nextId = queue.drawNext();

    state.board = clearedBoard;
    state.lines += clearedLines;
    state.holdUsed = false;
    state.gravityElapsedMs = 0;
    state.groundedElapsedMs = 0;

    const spawned = createSpawnPiece(nextId);
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
          spawnNextFromQueue();
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
          // Rotation, pause, hold, and hard-drop are integrated in Milestones 1.2-1.3
          break;
      }

      return createSnapshot(state, queue.peekNext());
    },

    advanceTime(elapsedMs: number): GameSnapshot {
      if (typeof elapsedMs !== 'number' || !Number.isFinite(elapsedMs) || elapsedMs < 0) {
        throw new RangeError(
          `Elapsed time must be a finite nonnegative number; received ${String(elapsedMs)}.`,
        );
      }
      if (elapsedMs === 0 || state.lifecycle !== 'running' || !state.activePiece) {
        return createSnapshot(state, queue.peekNext());
      }

      const backupState = cloneInternalState(state);
      try {
        let remainingMs = elapsedMs;
        while (remainingMs > 0 && state.lifecycle === 'running' && state.activePiece) {
          const gravityIntervalMs = computeGravityIntervalMs(state.level);
          const timeToGravity = gravityIntervalMs - state.gravityElapsedMs;
          const grounded = isPieceGrounded(state.board, state.activePiece);
          const timeToLock = grounded
            ? LOCK_DELAY_MS - state.groundedElapsedMs
            : Number.POSITIVE_INFINITY;
          const nextEventMs = Math.min(remainingMs, timeToGravity, timeToLock);

          state.gravityElapsedMs += nextEventMs;
          if (grounded) {
            state.groundedElapsedMs += nextEventMs;
          }
          remainingMs -= nextEventMs;

          // At equal event times, lock expiry has priority over a gravity attempt (R04).
          if (grounded && state.groundedElapsedMs >= LOCK_DELAY_MS) {
            lockActivePiece();
            continue;
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
      } catch (err) {
        state = backupState;
        throw err;
      }

      return createSnapshot(state, queue.peekNext());
    },

    restart(newRandom?: RandomSource): GameSnapshot {
      const candidateRandom = newRandom ?? randomSource;
      // Create and validate the fresh queue before mutating session state
      const nextQueue = createSevenBagQueue(candidateRandom);
      randomSource = candidateRandom;
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
      spawnNextFromQueue();
      return createSnapshot(state, queue.peekNext());
    },

    getSnapshot(): GameSnapshot {
      return createSnapshot(state, queue.peekNext());
    },
  };
}
