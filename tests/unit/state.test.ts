import { describe, expect, it } from 'vitest';
import { createEmptyBoard } from '../../src/game/board.ts';
import {
  computeGravityIntervalMs,
  createReadySessionState,
  createSnapshot,
  isGameAction,
  validateAndCloneFixture,
} from '../../src/game/state.ts';
import type { EngineFixture } from '../../src/game/types.ts';
import { buildRunningFixture } from '../fixtures/engine-fixtures.ts';

/**
 * Unit tests for C3 session state, gravity interval formula, fixture validation,
 * and snapshot isolation (R02, R04, R11, A3, A9).
 */
describe('C3 state: fixture validation, gravity interval, and snapshot isolation (R02 / R04 / R11 / A9)', () => {
  it('computes exact gravity intervals max(80, floor(1000 * 0.85^(level - 1))) with an 80 ms floor', () => {
    expect(computeGravityIntervalMs(1)).toBe(1000);
    expect(computeGravityIntervalMs(2)).toBe(850);
    expect(computeGravityIntervalMs(3)).toBe(722);
    expect(computeGravityIntervalMs(10)).toBe(Math.floor(1000 * Math.pow(0.85, 9)));
    expect(computeGravityIntervalMs(20)).toBe(80);
    expect(computeGravityIntervalMs(30)).toBe(80);
  });

  it('validates the documented game action union strictly', () => {
    for (const valid of [
      'start',
      'pause',
      'move-left',
      'move-right',
      'soft-drop',
      'rotate-cw',
      'rotate-ccw',
      'hold',
      'hard-drop',
    ]) {
      expect(isGameAction(valid)).toBe(true);
    }
    expect(isGameAction('drop')).toBe(false);
    expect(isGameAction('')).toBe(false);
    expect(isGameAction(null)).toBe(false);
  });

  it('accepts valid fixtures and isolates internal state from caller fixture and snapshot mutations', () => {
    const board = createEmptyBoard();
    board[19]![0] = 'I';
    const fixture = buildRunningFixture({
      board,
      activePiece: { id: 'T', orientation: 0, x: 3, y: 2 },
      heldPiece: 'O',
      holdUsed: true,
      score: 400,
      lines: 12,
      level: 2,
      gravityElapsedMs: 250,
      groundedElapsedMs: 0,
    });

    const internal = validateAndCloneFixture(fixture);
    // Mutating the caller's board after validation must not affect internal state
    board[19]![0] = null;
    expect(internal.board[19]![0]).toBe('I');

    const snapshot = createSnapshot(internal, 'Z');
    expect(snapshot.lifecycle).toBe('running');
    expect(snapshot.nextPiece).toBe('Z');
    expect(snapshot.heldPiece).toBe('O');
    expect(snapshot.holdUsed).toBe(true);
    expect(snapshot.score).toBe(400);
    expect(snapshot.lines).toBe(12);
    expect(snapshot.level).toBe(2);
    expect(snapshot.gravityIntervalMs).toBe(850);

    // Mutating the returned snapshot must not affect internal state or subsequent snapshots
    snapshot.board[19]![0] = 'L';
    (snapshot.activePiece!.cells as Array<{ x: number; y: number }>)[0]!.x = 99;
    const secondSnapshot = createSnapshot(internal, 'Z');
    expect(secondSnapshot.board[19]![0]).toBe('I');
    expect(secondSnapshot.activePiece!.cells[0]!.x).toBe(4);
  });

  it('rejects inconsistent or out-of-bounds fixtures with RangeError (R11 / A9)', () => {
    // 1. Invalid board dimensions
    expect(() =>
      validateAndCloneFixture({
        ...buildRunningFixture(),
        board: createEmptyBoard().slice(0, 19),
      }),
    ).toThrow(RangeError);

    // 2. Already-full row on stable fixture board
    const fullRowBoard = createEmptyBoard();
    for (let c = 0; c < 10; c += 1) fullRowBoard[19]![c] = 'I';
    expect(() =>
      validateAndCloneFixture(buildRunningFixture({ board: fullRowBoard })),
    ).toThrow(RangeError);

    // 3. O-piece with non-zero orientation
    expect(() =>
      validateAndCloneFixture(
        buildRunningFixture({
          activePiece: { id: 'O', orientation: 1, x: 4, y: 0 },
        }),
      ),
    ).toThrow(RangeError);

    // 4. Non-integer active origin coordinates
    expect(() =>
      validateAndCloneFixture(
        buildRunningFixture({
          activePiece: { id: 'T', orientation: 0, x: 3.5, y: 0 },
        }),
      ),
    ).toThrow(RangeError);

    // 5. Level inconsistent with 1 + floor(lines / 10)
    expect(() =>
      validateAndCloneFixture(
        buildRunningFixture({
          lines: 10,
          level: 1,
        }),
      ),
    ).toThrow(RangeError);

    // 6. Negative or non-safe-integer counters
    expect(() =>
      validateAndCloneFixture(
        buildRunningFixture({
          score: -10,
        }),
      ),
    ).toThrow(RangeError);

    // 7. Gravity elapsed >= current gravity interval (at level 1, interval is 1000)
    expect(() =>
      validateAndCloneFixture(
        buildRunningFixture({
          gravityElapsedMs: 1000,
        }),
      ),
    ).toThrow(RangeError);

    // 8. Grounded elapsed >= 500 or non-zero when airborne
    expect(() =>
      validateAndCloneFixture(
        buildRunningFixture({
          activePiece: { id: 'T', orientation: 0, x: 3, y: 5 },
          groundedElapsedMs: 10,
        }),
      ),
    ).toThrow(RangeError);

    expect(() =>
      validateAndCloneFixture(
        buildRunningFixture({
          activePiece: { id: 'T', orientation: 0, x: 3, y: 18 }, // grounded on floor
          groundedElapsedMs: 500,
        }),
      ),
    ).toThrow(RangeError);

    // 9. Ready state with non-empty board, active piece, or non-zero counters
    const nonEmptyReady: EngineFixture = {
      lifecycle: 'ready',
      board: createEmptyBoard(),
      activePiece: null,
      heldPiece: null,
      holdUsed: false,
      score: 10,
      lines: 0,
      level: 1,
      gravityElapsedMs: 0,
      groundedElapsedMs: 0,
    };
    expect(() => validateAndCloneFixture(nonEmptyReady)).toThrow(RangeError);

    // 10. Unsupported / extra fixture property (e.g., attempting to override queue/bag)
    expect(() =>
      validateAndCloneFixture({
        ...buildRunningFixture(),
        nextPiece: 'I',
      }),
    ).toThrow(RangeError);

    // 11. Ready state helper produces valid state
    const ready = createReadySessionState();
    expect(ready.lifecycle).toBe('ready');
    expect(ready.activePiece).toBeNull();
  });
});
