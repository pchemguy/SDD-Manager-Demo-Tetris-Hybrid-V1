import {
  cloneBoard,
  createEmptyBoard,
  isPieceGrounded,
  isValidPlacement,
  projectLandingPiece,
} from './board.ts';
import { cloneActivePiece, createActivePiece, isOrientation, isPieceId } from './pieces.ts';
import {
  BOARD_COLS,
  BOARD_ROWS,
  LOCK_DELAY_MS,
  type ActivePieceState,
  type BoardGrid,
  type CellValue,
  type GameAction,
  type GameSnapshot,
  type PieceId,
  type SessionLifecycle,
} from './types.ts';

/**
 * C3 Session state, gravity interval computation, strict fixture validation,
 * and isolated snapshot construction (R02, R04, R07, R11, A3, A9).
 */

export interface InternalSessionState {
  lifecycle: SessionLifecycle;
  board: BoardGrid;
  activePiece: ActivePieceState | null;
  heldPiece: PieceId | null;
  holdUsed: boolean;
  score: number;
  lines: number;
  level: number;
  gravityElapsedMs: number;
  groundedElapsedMs: number;
}

const VALID_ACTIONS: readonly GameAction[] = [
  'start',
  'pause',
  'move-left',
  'move-right',
  'soft-drop',
  'rotate-cw',
  'rotate-ccw',
  'hold',
  'hard-drop',
] as const;

const VALID_LIFECYCLES: readonly SessionLifecycle[] = [
  'ready',
  'running',
  'paused',
  'game-over',
] as const;

const ALLOWED_FIXTURE_KEYS = new Set([
  'lifecycle',
  'board',
  'activePiece',
  'heldPiece',
  'holdUsed',
  'score',
  'lines',
  'level',
  'gravityElapsedMs',
  'groundedElapsedMs',
]);

const ALLOWED_ACTIVE_PIECE_KEYS = new Set(['id', 'orientation', 'x', 'y']);

/**
 * Computes gravity interval in milliseconds: max(80, floor(1000 * 0.85^(level - 1))) (R04).
 */
export function computeGravityIntervalMs(level: number): number {
  if (!Number.isSafeInteger(level) || level < 1) {
    throw new RangeError(`Level must be a positive safe integer; received ${String(level)}.`);
  }
  return Math.max(80, Math.floor(1000 * Math.pow(0.85, level - 1)));
}

export function isGameAction(value: unknown): value is GameAction {
  return typeof value === 'string' && (VALID_ACTIONS as readonly string[]).includes(value);
}

export function isSessionLifecycle(value: unknown): value is SessionLifecycle {
  return typeof value === 'string' && (VALID_LIFECYCLES as readonly string[]).includes(value);
}

export function createReadySessionState(): InternalSessionState {
  return {
    lifecycle: 'ready',
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
}

/**
 * Strictly validates an engine fixture and returns an isolated internal state copy (R11).
 * Throws RangeError on any structural or semantic inconsistency before session creation.
 */
export function validateAndCloneFixture(rawFixture: unknown): InternalSessionState {
  if (!rawFixture || typeof rawFixture !== 'object' || Array.isArray(rawFixture)) {
    throw new RangeError('Fixture must be a plain object.');
  }

  const record = rawFixture as Record<string, unknown>;
  const keys = Object.keys(record);
  for (const key of keys) {
    if (!ALLOWED_FIXTURE_KEYS.has(key)) {
      throw new RangeError(`Unsupported fixture field "${key}".`);
    }
  }
  for (const requiredKey of ALLOWED_FIXTURE_KEYS) {
    if (!(requiredKey in record)) {
      throw new RangeError(`Missing required fixture field "${requiredKey}".`);
    }
  }

  const lifecycle = record.lifecycle;
  if (!isSessionLifecycle(lifecycle)) {
    throw new RangeError(`Invalid fixture lifecycle "${String(lifecycle)}".`);
  }

  // Validate 20x10 board and ensure no already-full row exists on a stable fixture board (R11)
  const rawBoard = record.board;
  if (!Array.isArray(rawBoard) || rawBoard.length !== BOARD_ROWS) {
    throw new RangeError(`Fixture board must have exactly ${BOARD_ROWS} rows.`);
  }
  const board: BoardGrid = [];
  let hasAnySettledCell = false;
  for (let r = 0; r < BOARD_ROWS; r += 1) {
    const rawRow = rawBoard[r];
    if (!Array.isArray(rawRow) || rawRow.length !== BOARD_COLS) {
      throw new RangeError(`Fixture board row ${r} must have exactly ${BOARD_COLS} columns.`);
    }
    const rowCopy: CellValue[] = [];
    let fullRowCount = 0;
    for (let c = 0; c < BOARD_COLS; c += 1) {
      const cell = rawRow[c];
      if (cell !== null && !isPieceId(cell)) {
        throw new RangeError(`Invalid cell value at (${c}, ${r}): ${String(cell)}.`);
      }
      if (cell !== null) {
        hasAnySettledCell = true;
        fullRowCount += 1;
      }
      rowCopy.push(cell);
    }
    if (fullRowCount === BOARD_COLS) {
      throw new RangeError(`Stable fixture board cannot contain an already-full row at index ${r}.`);
    }
    board.push(rowCopy);
  }

  // Validate counters (score, lines, level)
  const score = record.score;
  const lines = record.lines;
  const level = record.level;
  if (typeof score !== 'number' || !Number.isSafeInteger(score) || score < 0) {
    throw new RangeError('Fixture score must be a nonnegative safe integer.');
  }
  if (typeof lines !== 'number' || !Number.isSafeInteger(lines) || lines < 0) {
    throw new RangeError('Fixture lines must be a nonnegative safe integer.');
  }
  const expectedLevel = 1 + Math.floor(lines / 10);
  if (typeof level !== 'number' || !Number.isSafeInteger(level) || level !== expectedLevel) {
    throw new RangeError(
      `Fixture level (${String(level)}) must equal 1 + floor(lines / 10) (${expectedLevel}).`,
    );
  }

  // Validate hold state
  const heldPiece = record.heldPiece;
  if (heldPiece !== null && !isPieceId(heldPiece)) {
    throw new RangeError(`Invalid fixture heldPiece "${String(heldPiece)}".`);
  }
  const holdUsed = record.holdUsed;
  if (typeof holdUsed !== 'boolean') {
    throw new RangeError('Fixture holdUsed must be a boolean.');
  }

  // Validate timers
  const gravityIntervalMs = computeGravityIntervalMs(level);
  const gravityElapsedMs = record.gravityElapsedMs;
  const groundedElapsedMs = record.groundedElapsedMs;
  if (
    typeof gravityElapsedMs !== 'number' ||
    !Number.isFinite(gravityElapsedMs) ||
    gravityElapsedMs < 0 ||
    gravityElapsedMs >= gravityIntervalMs
  ) {
    throw new RangeError(
      `Fixture gravityElapsedMs must be finite and in [0, ${gravityIntervalMs}).`,
    );
  }
  if (
    typeof groundedElapsedMs !== 'number' ||
    !Number.isFinite(groundedElapsedMs) ||
    groundedElapsedMs < 0 ||
    groundedElapsedMs >= LOCK_DELAY_MS
  ) {
    throw new RangeError(`Fixture groundedElapsedMs must be finite and in [0, ${LOCK_DELAY_MS}).`);
  }

  // Validate activePiece and lifecycle consistency
  const rawActive = record.activePiece;
  let activePiece: ActivePieceState | null = null;
  if (rawActive !== null) {
    if (typeof rawActive !== 'object' || Array.isArray(rawActive)) {
      throw new RangeError('Fixture activePiece must be an object or null.');
    }
    const activeRecord = rawActive as Record<string, unknown>;
    for (const k of Object.keys(activeRecord)) {
      if (!ALLOWED_ACTIVE_PIECE_KEYS.has(k)) {
        throw new RangeError(`Unsupported activePiece field "${k}".`);
      }
    }
    const id = activeRecord.id;
    const orientation = activeRecord.orientation;
    const x = activeRecord.x;
    const y = activeRecord.y;
    if (!isPieceId(id)) {
      throw new RangeError(`Invalid activePiece id "${String(id)}".`);
    }
    if (!isOrientation(orientation)) {
      throw new RangeError(`Invalid activePiece orientation "${String(orientation)}".`);
    }
    if (id === 'O' && orientation !== 0) {
      throw new RangeError('O piece orientation in a fixture must be 0.');
    }
    if (typeof x !== 'number' || !Number.isInteger(x) || typeof y !== 'number' || !Number.isInteger(y)) {
      throw new RangeError('Fixture activePiece origin coordinates (x, y) must be integers.');
    }
    const candidate = createActivePiece(id, orientation, x, y);
    if (!isValidPlacement(board, candidate.cells)) {
      throw new RangeError('Fixture activePiece placement is out of bounds or overlaps settled cells.');
    }
    activePiece = candidate;
  }

  if (lifecycle === 'running' || lifecycle === 'paused') {
    if (!activePiece) {
      throw new RangeError(`Fixture lifecycle "${lifecycle}" requires a valid activePiece.`);
    }
    const grounded = isPieceGrounded(board, activePiece);
    if (!grounded && groundedElapsedMs !== 0) {
      throw new RangeError('Airborne activePiece must have groundedElapsedMs === 0.');
    }
  } else {
    // ready or game-over
    if (activePiece !== null) {
      throw new RangeError(`Fixture lifecycle "${lifecycle}" must have activePiece === null.`);
    }
    if (gravityElapsedMs !== 0 || groundedElapsedMs !== 0) {
      throw new RangeError(`Fixture lifecycle "${lifecycle}" must have zero timers.`);
    }
    if (lifecycle === 'ready') {
      if (hasAnySettledCell || heldPiece !== null || holdUsed || score !== 0 || lines !== 0 || level !== 1) {
        throw new RangeError(
          'Ready fixture requires empty board, empty hold, holdUsed false, zero score/lines/timers, and level 1.',
        );
      }
    }
  }

  return {
    lifecycle,
    board,
    activePiece,
    heldPiece,
    holdUsed,
    score,
    lines,
    level,
    gravityElapsedMs,
    groundedElapsedMs,
  };
}

/**
 * Produces a deep, isolated GameSnapshot from internal state and next-piece preview (R07, R11).
 */
export function createSnapshot(state: InternalSessionState, nextPiece: PieceId): GameSnapshot {
  const boardCopy = cloneBoard(state.board);
  const activeCopy = state.activePiece ? cloneActivePiece(state.activePiece) : null;
  let ghostCopy: ActivePieceState | null = null;
  let isGrounded = false;

  if (state.activePiece) {
    isGrounded = isPieceGrounded(state.board, state.activePiece);
    const { landingPiece } = projectLandingPiece(state.board, state.activePiece);
    ghostCopy = cloneActivePiece(landingPiece);
  }

  return {
    lifecycle: state.lifecycle,
    board: boardCopy,
    activePiece: activeCopy,
    ghostPiece: ghostCopy,
    nextPiece,
    heldPiece: state.heldPiece,
    holdUsed: state.holdUsed,
    score: state.score,
    lines: state.lines,
    level: state.level,
    gravityIntervalMs: computeGravityIntervalMs(state.level),
    gravityElapsedMs: state.gravityElapsedMs,
    groundedElapsedMs: state.groundedElapsedMs,
    isGrounded,
  };
}
