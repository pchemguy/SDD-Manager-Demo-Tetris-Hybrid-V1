import { createActivePiece, getBoardCells, getRotationCandidates } from './pieces.ts';
import {
  BOARD_COLS,
  BOARD_ROWS,
  type ActivePieceState,
  type BoardGrid,
  type CellValue,
  type Point,
  type RotationDirection,
} from './types.ts';

/**
 * C1 Board geometry (R01, R05, R07).
 * Owns 10x20 board allocation, bounds/overlap validation, candidate translation/rotation
 * resolution, landing/ghost projection, immutable locking, and simultaneous row removal.
 */

export interface RowClearResult {
  readonly board: BoardGrid;
  readonly clearedLines: number;
  readonly clearedRowIndices: readonly number[];
}

export function createEmptyBoard(): BoardGrid {
  return Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, (): CellValue => null),
  );
}

export function cloneBoard(board: readonly (readonly CellValue[])[]): BoardGrid {
  return board.map((row) => row.slice());
}

export function isCellInBounds(x: number, y: number): boolean {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    x < BOARD_COLS &&
    y >= 0 &&
    y < BOARD_ROWS
  );
}

export function isValidPlacement(
  board: readonly (readonly CellValue[])[],
  cells: readonly Point[],
): boolean {
  if (cells.length !== 4) {
    return false;
  }
  for (const cell of cells) {
    if (!isCellInBounds(cell.x, cell.y)) {
      return false;
    }
    const row = board[cell.y];
    if (!row || row[cell.x] !== null) {
      return false;
    }
  }
  return true;
}

export function isValidPiecePlacement(
  board: readonly (readonly CellValue[])[],
  piece: Pick<ActivePieceState, 'id' | 'orientation' | 'x' | 'y'>,
): boolean {
  if (!Number.isInteger(piece.x) || !Number.isInteger(piece.y)) {
    return false;
  }
  const cells = getBoardCells(piece.id, piece.orientation, piece.x, piece.y);
  return isValidPlacement(board, cells);
}

export function tryTranslatePiece(
  board: readonly (readonly CellValue[])[],
  piece: ActivePieceState,
  dx: number,
  dy: number,
): ActivePieceState | null {
  const candidate = createActivePiece(piece.id, piece.orientation, piece.x + dx, piece.y + dy);
  return isValidPlacement(board, candidate.cells) ? candidate : null;
}

export function tryRotatePiece(
  board: readonly (readonly CellValue[])[],
  piece: ActivePieceState,
  direction: RotationDirection,
): ActivePieceState | null {
  const candidates = getRotationCandidates(piece, direction);
  for (const candidate of candidates) {
    if (isValidPlacement(board, candidate.cells)) {
      return candidate;
    }
  }
  return null;
}

export function isPieceGrounded(
  board: readonly (readonly CellValue[])[],
  piece: ActivePieceState,
): boolean {
  return tryTranslatePiece(board, piece, 0, 1) === null;
}

/**
 * Computes the maximal nonnegative downward translation of the active piece
 * that remains valid at every step (R07).
 */
export function projectLandingPiece(
  board: readonly (readonly CellValue[])[],
  piece: ActivePieceState,
): { readonly landingPiece: ActivePieceState; readonly dropDistance: number } {
  let current = createActivePiece(piece.id, piece.orientation, piece.x, piece.y);
  let dropDistance = 0;
  while (true) {
    const next = tryTranslatePiece(board, current, 0, 1);
    if (!next) {
      break;
    }
    current = next;
    dropDistance += 1;
  }
  return { landingPiece: current, dropDistance };
}

/**
 * Returns a new board with the active piece's four cells written once (R05).
 */
export function lockPieceOnBoard(
  board: readonly (readonly CellValue[])[],
  piece: ActivePieceState,
): BoardGrid {
  if (!isValidPlacement(board, piece.cells)) {
    throw new RangeError('Cannot lock an invalid or overlapping active piece placement.');
  }
  const nextBoard = cloneBoard(board);
  for (const cell of piece.cells) {
    nextBoard[cell.y]![cell.x] = piece.id;
  }
  return nextBoard;
}

/**
 * Simultaneously removes all full rows (10 non-null cells) and prepends the
 * same number of empty rows while preserving the relative order of retained rows (R05).
 */
export function clearFullRows(board: readonly (readonly CellValue[])[]): RowClearResult {
  const retainedRows: CellValue[][] = [];
  const clearedRowIndices: number[] = [];

  for (let rowIndex = 0; rowIndex < BOARD_ROWS; rowIndex += 1) {
    const row = board[rowIndex];
    if (!row || row.length !== BOARD_COLS) {
      throw new RangeError(`Invalid board row at index ${rowIndex}.`);
    }
    const isFull = row.every((cell) => cell !== null);
    if (isFull) {
      clearedRowIndices.push(rowIndex);
    } else {
      retainedRows.push(row.slice());
    }
  }

  const clearedLines = clearedRowIndices.length;
  const emptyRows = Array.from({ length: clearedLines }, () =>
    Array.from({ length: BOARD_COLS }, (): CellValue => null),
  );

  return {
    board: [...emptyRows, ...retainedRows],
    clearedLines,
    clearedRowIndices,
  };
}
