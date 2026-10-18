import { describe, expect, it } from 'vitest';
import {
  clearFullRows,
  cloneBoard,
  createEmptyBoard,
  isCellInBounds,
  isPieceGrounded,
  isValidPiecePlacement,
  isValidPlacement,
  lockPieceOnBoard,
  projectLandingPiece,
  tryRotatePiece,
  tryTranslatePiece,
} from '../../src/game/board.ts';
import { createActivePiece, createSpawnPiece } from '../../src/game/pieces.ts';
import { BOARD_COLS, BOARD_ROWS } from '../../src/game/types.ts';

/**
 * Unit tests for C1 board geometry, placement, wall kicks, landing projection,
 * and simultaneous row removal (R01, R05, R07, A1, A4, A6).
 */
describe('C1 board geometry: placement, kicks, landing, and row clearing', () => {
  it('creates an isolated 20x10 empty board and checks cell bounds strictly', () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(BOARD_ROWS);
    for (const row of board) {
      expect(row).toHaveLength(BOARD_COLS);
      expect(row.every((cell) => cell === null)).toBe(true);
    }

    expect(isCellInBounds(0, 0)).toBe(true);
    expect(isCellInBounds(9, 19)).toBe(true);
    expect(isCellInBounds(-1, 0)).toBe(false);
    expect(isCellInBounds(10, 0)).toBe(false);
    expect(isCellInBounds(0, -1)).toBe(false);
    expect(isCellInBounds(0, 20)).toBe(false);
    expect(isCellInBounds(1.5, 2)).toBe(false);
  });

  it('rejects placements outside walls/ceiling/floor or overlapping settled cells', () => {
    const board = createEmptyBoard();
    const spawnT = createSpawnPiece('T');
    expect(isValidPiecePlacement(board, spawnT)).toBe(true);

    // Left wall violation: T at x = -1 has a cell at (-1, 1)
    expect(isValidPiecePlacement(board, createActivePiece('T', 0, -1, 0))).toBe(false);
    // Right wall violation: T at x = 8 has a cell at (10, 1)
    expect(isValidPiecePlacement(board, createActivePiece('T', 0, 8, 0))).toBe(false);
    // Ceiling violation: T at y = -1 has a cell at (4, -1)
    expect(isValidPiecePlacement(board, createActivePiece('T', 0, 3, -1))).toBe(false);
    // Floor violation: T at y = 19 has cells at y = 20
    expect(isValidPiecePlacement(board, createActivePiece('T', 0, 3, 19))).toBe(false);

    // Settled overlap violation
    board[1]![4] = 'J';
    expect(isValidPiecePlacement(board, spawnT)).toBe(false);
    expect(isValidPlacement(board, spawnT.cells)).toBe(false);
  });

  it('translates pieces by one column or row only when the target placement is valid', () => {
    const board = createEmptyBoard();
    const piece = createActivePiece('T', 0, 0, 5);

    // Blocked at left wall (x = 0)
    expect(tryTranslatePiece(board, piece, -1, 0)).toBeNull();
    // Valid rightward move
    const movedRight = tryTranslatePiece(board, piece, 1, 0);
    expect(movedRight).not.toBeNull();
    expect(movedRight!.x).toBe(1);
    expect(movedRight!.y).toBe(5);
  });

  it('selects the first valid horizontal wall-kick candidate in exact R01 order and rejects floor/blocked kicks', () => {
    const board = createEmptyBoard();

    // Vertical I-piece (orientation 1, cells at local x=2, y=0..3) placed at origin x = -2 (board x = 0)
    // Rotating CW to orientation 2 (horizontal at local y=2, x=0..3) at origin x = -2 would put cells at x = -2, -1, 0, 1.
    // Candidate offsets: (0,0)->x=-2 invalid; (-1,0)->x=-3 invalid; (+1,0)->x=-1 invalid; (-2,0)->x=-4 invalid; (+2,0)->x=0 valid!
    const leftWallI = createActivePiece('I', 1, -2, 4);
    expect(isValidPiecePlacement(board, leftWallI)).toBe(true);
    const kickedFromLeft = tryRotatePiece(board, leftWallI, 'cw');
    expect(kickedFromLeft).not.toBeNull();
    expect(kickedFromLeft!.x).toBe(0);
    expect(kickedFromLeft!.y).toBe(4);
    expect(kickedFromLeft!.orientation).toBe(2);

    // Candidate priority check: when (0,0) is blocked and both (-1,0) and (+1,0) are valid, (-1,0) wins
    const priorityBoard = createEmptyBoard();
    priorityBoard[7]![6] = 'Z';
    const jPiece = createActivePiece('J', 1, 4, 5);
    expect(isValidPiecePlacement(priorityBoard, jPiece)).toBe(true);
    const rotatedJ = tryRotatePiece(priorityBoard, jPiece, 'cw');
    expect(rotatedJ).not.toBeNull();
    expect(rotatedJ!.x).toBe(3);
    expect(rotatedJ!.y).toBe(5);
    expect(rotatedJ!.orientation).toBe(2);

    // Floor violation cannot be kicked vertically (no vertical kicks in R01)
    const floorT = createActivePiece('T', 0, 3, 18);
    expect(isValidPiecePlacement(board, floorT)).toBe(true);
    expect(tryRotatePiece(board, floorT, 'cw')).toBeNull();
  });

  it('projects maximal nonnegative landing translation without passing through settled cells (R07 / A6)', () => {
    const board = createEmptyBoard();
    // Create an overhang at row 15 col 4, with empty cells below it at rows 16..19
    board[15]![4] = 'L';
    const spawnO = createSpawnPiece('O'); // occupies cols 4, 5 at rows 0, 1
    const { landingPiece, dropDistance } = projectLandingPiece(board, spawnO);
    // O must stop with its bottom at row 14 (origin y = 13), never passing through row 15
    expect(landingPiece.x).toBe(4);
    expect(landingPiece.y).toBe(13);
    expect(dropDistance).toBe(13);
    expect(isPieceGrounded(board, landingPiece)).toBe(true);
    expect(isPieceGrounded(board, spawnO)).toBe(false);
  });

  it('locks active piece cells immutably and removes 1 to 4 full rows simultaneously while preserving relative order (R05 / A4)', () => {
    const board = createEmptyBoard();
    // Row 16: partial marker row with 'T' at col 0
    board[16]![0] = 'T';
    // Row 17: full except col 9
    for (let c = 0; c < 9; c += 1) board[17]![c] = 'J';
    // Row 18: partial marker row with 'S' at col 2
    board[18]![2] = 'S';
    // Row 19: full except col 9
    for (let c = 0; c < 9; c += 1) board[19]![c] = 'L';

    // Lock a vertical I-piece (orientation 1, local x=2, y=0..3) at origin (7, 16) -> board col 9, rows 16..19
    const verticalI = createActivePiece('I', 1, 7, 16);
    const lockedBoard = lockPieceOnBoard(board, verticalI);

    // Original board must remain untouched
    expect(board[17]![9]).toBeNull();
    expect(lockedBoard[17]![9]).toBe('I');
    expect(lockedBoard[19]![9]).toBe('I');

    const cleared = clearFullRows(lockedBoard);
    expect(cleared.clearedLines).toBe(2);
    expect(cleared.clearedRowIndices).toEqual([17, 19]);
    expect(cleared.board).toHaveLength(BOARD_ROWS);

    // Top two rows must be empty
    expect(cleared.board[0]!.every((c) => c === null)).toBe(true);
    expect(cleared.board[1]!.every((c) => c === null)).toBe(true);

    // Former row 16 shifts down to row 18, former row 18 shifts down to row 19
    expect(cleared.board[18]![0]).toBe('T');
    expect(cleared.board[18]![9]).toBe('I');
    expect(cleared.board[19]![2]).toBe('S');
    expect(cleared.board[19]![9]).toBe('I');

    // Clone isolation check
    const copy = cloneBoard(cleared.board);
    copy[19]![0] = 'Z';
    expect(cleared.board[19]![0]).toBeNull();
  });
});
