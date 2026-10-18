/**
 * Shared engine types and value contracts (C1–C6).
 * Pure TypeScript definitions with zero runtime browser dependencies.
 */

export const BOARD_COLS = 10;
export const BOARD_ROWS = 20;
export const LOCK_DELAY_MS = 500;

export type PieceId = 'I' | 'O' | 'T' | 'J' | 'L' | 'S' | 'Z';

export const ALL_PIECE_IDS: readonly PieceId[] = ['I', 'O', 'T', 'J', 'L', 'S', 'Z'] as const;

export type Orientation = 0 | 1 | 2 | 3;

export type RotationDirection = 'cw' | 'ccw';

export type CellValue = PieceId | null;

export type BoardGrid = CellValue[][];

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface ActivePieceState {
  readonly id: PieceId;
  readonly orientation: Orientation;
  readonly x: number;
  readonly y: number;
  readonly cells: readonly Point[];
}

export type SessionLifecycle = 'ready' | 'running' | 'paused' | 'game-over';

export type GameAction =
  | 'start'
  | 'pause'
  | 'move-left'
  | 'move-right'
  | 'soft-drop'
  | 'rotate-cw'
  | 'rotate-ccw'
  | 'hold'
  | 'hard-drop';

export type RandomSource = () => number;

export interface GameSnapshot {
  readonly lifecycle: SessionLifecycle;
  readonly board: CellValue[][];
  readonly activePiece: ActivePieceState | null;
  readonly ghostPiece: ActivePieceState | null;
  readonly nextPiece: PieceId;
  readonly heldPiece: PieceId | null;
  readonly holdUsed: boolean;
  readonly score: number;
  readonly lines: number;
  readonly level: number;
  readonly gravityIntervalMs: number;
  readonly gravityElapsedMs: number;
  readonly groundedElapsedMs: number;
  readonly isGrounded: boolean;
}

export interface EngineFixture {
  readonly lifecycle: SessionLifecycle;
  readonly board: readonly (readonly CellValue[])[];
  readonly activePiece: {
    readonly id: PieceId;
    readonly orientation: Orientation;
    readonly x: number;
    readonly y: number;
  } | null;
  readonly heldPiece: PieceId | null;
  readonly holdUsed: boolean;
  readonly score: number;
  readonly lines: number;
  readonly level: number;
  readonly gravityElapsedMs: number;
  readonly groundedElapsedMs: number;
}
