import { describe, expect, it } from 'vitest';
import { createEmptyBoard } from '../../src/game/board.ts';
import { createGameEngine } from '../../src/game/engine.ts';
import { buildRunningFixture, createIdentityBagRandom } from '../fixtures/engine-fixtures.ts';

/**
 * Unit and integration tests for T-005 C3 lock, simultaneous line clear,
 * next-piece spawn, and colliding-spawn game-over transitions (R02, R04, R05, A3, A4).
 */
describe('C3 engine: lock, simultaneous line clear, spawn, and game-over transitions (R02 / R04 / R05 / A3 / A4)', () => {
  it('remains active at 499 ms of grounded contact and locks at the exact 500 ms boundary', () => {
    const engine = createGameEngine({
      random: createIdentityBagRandom(),
      fixture: buildRunningFixture({
        // T at (3, 18) occupies (4, 18) and (3..5, 19) -> resting on the floor (row 19)
        activePiece: { id: 'T', orientation: 0, x: 3, y: 18 },
        holdUsed: true,
      }),
    });

    const at499 = engine.advanceTime(499);
    expect(at499.lifecycle).toBe('running');
    expect(at499.activePiece?.id).toBe('T');
    expect(at499.activePiece?.y).toBe(18);
    expect(at499.groundedElapsedMs).toBe(499);
    expect(at499.board[19]![4]).toBeNull();

    // +1 ms reaches the exact 500 ms lock boundary
    const at500 = engine.advanceTime(1);
    expect(at500.lifecycle).toBe('running');
    // Old T piece cells are now settled on the board
    expect(at500.board[18]![4]).toBe('T');
    expect(at500.board[19]![3]).toBe('T');
    expect(at500.board[19]![4]).toBe('T');
    expect(at500.board[19]![5]).toBe('T');
    // Next piece ('I' from identity bag) has spawned at top with fresh timers and holdUsed reset
    expect(at500.activePiece?.id).toBe('I');
    expect(at500.activePiece?.x).toBe(3);
    expect(at500.activePiece?.y).toBe(0);
    expect(at500.gravityElapsedMs).toBe(0);
    expect(at500.groundedElapsedMs).toBe(0);
    expect(at500.holdUsed).toBe(false);
    expect(at500.nextPiece).toBe('O');
  });

  it('prioritizes lock expiry over gravity when both events occur at the exact same timestamp (R04)', () => {
    // At level 1 (gravityIntervalMs = 1000), set gravityElapsedMs = 800 and groundedElapsedMs = 300.
    // Both timeToGravity (200 ms) and timeToLock (200 ms) expire at +200 ms.
    // Lock expiry has priority: the grounded piece locks once and the newly spawned piece
    // starts at y = 0 with gravityElapsedMs = 0 (not immediately dropped by the old gravity tick).
    const engine = createGameEngine({
      random: createIdentityBagRandom(),
      fixture: buildRunningFixture({
        activePiece: { id: 'O', orientation: 0, x: 4, y: 18 },
        gravityElapsedMs: 800,
        groundedElapsedMs: 300,
      }),
    });

    const snap = engine.advanceTime(200);
    expect(snap.board[18]![4]).toBe('O');
    expect(snap.board[19]![5]).toBe('O');
    expect(snap.activePiece?.id).toBe('I');
    expect(snap.activePiece?.y).toBe(0);
    expect(snap.gravityElapsedMs).toBe(0);
    expect(snap.groundedElapsedMs).toBe(0);
  });

  it('advances chronologically across gravity, contact, lock, spawn, and next-piece descent in one elapsed-time call', () => {
    // O piece at y = 17 (1 cell above the floor at y = 18):
    // - At t = 1000 ms: drops 1 row to y = 18 (now grounded, groundedElapsedMs = 0).
    // - At t = 1500 ms (+500 ms): locks at y = 18, spawns 'I' at y = 0.
    // - Remaining 1200 ms: at t = 2500 ms (+1000 ms), 'I' drops 1 row to y = 1;
    //   final 200 ms leaves 'I' at y = 1 with gravityElapsedMs = 200.
    const engine = createGameEngine({
      random: createIdentityBagRandom(),
      fixture: buildRunningFixture({
        activePiece: { id: 'O', orientation: 0, x: 4, y: 17 },
      }),
    });

    const snap = engine.advanceTime(2700);
    expect(snap.board[18]![4]).toBe('O');
    expect(snap.board[19]![4]).toBe('O');
    expect(snap.activePiece?.id).toBe('I');
    expect(snap.activePiece?.y).toBe(1);
    expect(snap.gravityElapsedMs).toBe(200);
    expect(snap.groundedElapsedMs).toBe(0);
  });

  it('simultaneously clears 1 to 4 completed rows on lock while preserving relative order of retained rows (R05 / A4)', () => {
    const board = createEmptyBoard();
    // Set up rows 16..19 so vertical I-piece at col 9 (orientation 1, origin x=7, y=16) completes rows 17 and 19
    // while rows 16 and 18 remain partial with distinct markers
    board[16]![1] = 'S';
    for (let c = 0; c < 9; c += 1) board[17]![c] = 'J';
    board[18]![2] = 'Z';
    for (let c = 0; c < 9; c += 1) board[19]![c] = 'L';

    const engine = createGameEngine({
      random: createIdentityBagRandom(),
      fixture: buildRunningFixture({
        board,
        activePiece: { id: 'I', orientation: 1, x: 7, y: 16 },
      }),
    });

    const afterLock = engine.advanceTime(500);
    expect(afterLock.lines).toBe(2);
    // Rows 0 and 1 are empty
    expect(afterLock.board[0]!.every((c) => c === null)).toBe(true);
    expect(afterLock.board[1]!.every((c) => c === null)).toBe(true);
    // Retained row 16 moved to 18, retained row 18 moved to 19
    expect(afterLock.board[18]![1]).toBe('S');
    expect(afterLock.board[18]![9]).toBe('I');
    expect(afterLock.board[19]![2]).toBe('Z');
    expect(afterLock.board[19]![9]).toBe('I');

    // Also verify a 4-line simultaneous clear
    const quadBoard = createEmptyBoard();
    quadBoard[15]![0] = 'T'; // marker above the 4 cleared rows
    for (let r = 16; r <= 19; r += 1) {
      for (let c = 0; c < 9; c += 1) {
        quadBoard[r]![c] = 'O';
      }
    }
    const quadEngine = createGameEngine({
      random: createIdentityBagRandom(),
      fixture: buildRunningFixture({
        board: quadBoard,
        activePiece: { id: 'I', orientation: 1, x: 7, y: 16 },
      }),
    });

    const afterQuad = quadEngine.advanceTime(500);
    expect(afterQuad.lines).toBe(4);
    expect(afterQuad.board[19]![0]).toBe('T');
    expect(afterQuad.board[18]!.every((c) => c === null)).toBe(true);
  });

  it('transitions to game-over when the post-lock spawn overlaps settled cells and ignores subsequent time/actions (R02)', () => {
    const board = createEmptyBoard();
    // Occupy (4, 1) where the next spawned 'I' piece (cells (3,1)..(6,1)) will collide
    board[1]![4] = 'Z';
    const engine = createGameEngine({
      random: createIdentityBagRandom(),
      fixture: buildRunningFixture({
        board,
        activePiece: { id: 'O', orientation: 0, x: 0, y: 18 },
      }),
    });

    const gameOverSnap = engine.advanceTime(1500);
    expect(gameOverSnap.lifecycle).toBe('game-over');
    expect(gameOverSnap.activePiece).toBeNull();
    expect(gameOverSnap.ghostPiece).toBeNull();
    expect(gameOverSnap.gravityElapsedMs).toBe(0);
    expect(gameOverSnap.groundedElapsedMs).toBe(0);
    // Locked O-piece and prior settled cell remain visible
    expect(gameOverSnap.board[18]![0]).toBe('O');
    expect(gameOverSnap.board[19]![1]).toBe('O');
    expect(gameOverSnap.board[1]![4]).toBe('Z');

    // Subsequent gameplay actions and elapsed time in game-over are no-ops
    expect(engine.dispatch('move-left').lifecycle).toBe('game-over');
    expect(engine.advanceTime(1000).lifecycle).toBe('game-over');
  });
});
