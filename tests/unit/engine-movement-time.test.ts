import { describe, expect, it } from 'vitest';
import { createEmptyBoard } from '../../src/game/board.ts';
import { createGameEngine } from '../../src/game/engine.ts';
import type { GameAction } from '../../src/game/types.ts';
import { buildRunningFixture, createIdentityBagRandom } from '../fixtures/engine-fixtures.ts';

/**
 * Unit tests for T-004 C3 engine session lifecycle (ready/start/restart),
 * horizontal/soft-drop movement, gravity accumulation, and grounded/airborne timing
 * (R02, R04, R11, A3, A9).
 */
describe('C3 engine: session state, movement, and elapsed-time handling (R02 / R04 / R11 / A3 / A9)', () => {
  it('initializes in ready state with preview piece, transitions to running on start, and treats start outside ready as a no-op', () => {
    const engine = createGameEngine({ random: createIdentityBagRandom() });
    const initial = engine.getSnapshot();

    expect(initial.lifecycle).toBe('ready');
    expect(initial.activePiece).toBeNull();
    expect(initial.ghostPiece).toBeNull();
    expect(initial.nextPiece).toBe('I');
    expect(initial.heldPiece).toBeNull();
    expect(initial.holdUsed).toBe(false);
    expect(initial.score).toBe(0);
    expect(initial.lines).toBe(0);
    expect(initial.level).toBe(1);

    // Gameplay actions and elapsed time in ready state are no-ops
    expect(engine.dispatch('move-left').lifecycle).toBe('ready');
    expect(engine.advanceTime(500).lifecycle).toBe('ready');

    // Start consumes 'I' from the queue, spawns it, and previews 'O'
    const started = engine.dispatch('start');
    expect(started.lifecycle).toBe('running');
    expect(started.activePiece?.id).toBe('I');
    expect(started.activePiece?.x).toBe(3);
    expect(started.activePiece?.y).toBe(0);
    expect(started.nextPiece).toBe('O');

    // Start while running is a no-op
    const startedAgain = engine.dispatch('start');
    expect(startedAgain.activePiece?.id).toBe('I');
    expect(startedAgain.nextPiece).toBe('O');
  });

  it('restarts from any state into a fresh running session with reset counters, timers, and bag', () => {
    const board = createEmptyBoard();
    board[19]![0] = 'Z';
    const engine = createGameEngine({
      random: createIdentityBagRandom(),
      fixture: buildRunningFixture({
        board,
        activePiece: { id: 'T', orientation: 0, x: 3, y: 18 },
        heldPiece: 'J',
        holdUsed: true,
        score: 900,
        lines: 20,
        level: 3,
        gravityElapsedMs: 300,
        groundedElapsedMs: 250,
      }),
    });

    const restarted = engine.restart(createIdentityBagRandom());
    expect(restarted.lifecycle).toBe('running');
    expect(restarted.score).toBe(0);
    expect(restarted.lines).toBe(0);
    expect(restarted.level).toBe(1);
    expect(restarted.heldPiece).toBeNull();
    expect(restarted.holdUsed).toBe(false);
    expect(restarted.gravityElapsedMs).toBe(0);
    expect(restarted.groundedElapsedMs).toBe(0);
    expect(restarted.board[19]![0]).toBeNull();
    expect(restarted.activePiece?.id).toBe('I');
    expect(restarted.nextPiece).toBe('O');
  });

  it('moves horizontally by one column when valid and preserves state when blocked by walls or settled cells', () => {
    const board = createEmptyBoard();
    board[1]![2] = 'L'; // Block to the left of spawn T (which occupies x=3..5 on row 1)
    const engine = createGameEngine({
      random: createIdentityBagRandom(),
      fixture: buildRunningFixture({
        board,
        activePiece: { id: 'T', orientation: 0, x: 3, y: 0 },
        gravityElapsedMs: 420,
      }),
    });

    // Blocked leftward move preserves x and gravity timer
    const blockedLeft = engine.dispatch('move-left');
    expect(blockedLeft.activePiece?.x).toBe(3);
    expect(blockedLeft.gravityElapsedMs).toBe(420);

    // Valid rightward move shifts x to 4 and preserves airborne gravity timer
    const movedRight = engine.dispatch('move-right');
    expect(movedRight.activePiece?.x).toBe(4);
    expect(movedRight.gravityElapsedMs).toBe(420);
  });

  it('accumulates gravity elapsed time, steps downward at each interval, and resets gravity timer on soft drop', () => {
    const engine = createGameEngine({
      random: createIdentityBagRandom(),
      fixture: buildRunningFixture({
        activePiece: { id: 'T', orientation: 0, x: 3, y: 0 },
      }),
    });

    // Advance 999 ms at level 1 (interval 1000 ms): still at y = 0
    const beforeDrop = engine.advanceTime(999);
    expect(beforeDrop.activePiece?.y).toBe(0);
    expect(beforeDrop.gravityElapsedMs).toBe(999);

    // Advance 1 ms -> 1000 ms: drops 1 row to y = 1, gravity timer resets to 0
    const afterOneStep = engine.advanceTime(1);
    expect(afterOneStep.activePiece?.y).toBe(1);
    expect(afterOneStep.gravityElapsedMs).toBe(0);

    // Accumulate 600 ms, then perform soft-drop: moves to y = 2 and resets gravityElapsedMs to 0
    engine.advanceTime(600);
    const softDropped = engine.dispatch('soft-drop');
    expect(softDropped.activePiece?.y).toBe(2);
    expect(softDropped.gravityElapsedMs).toBe(0);
  });

  it('tracks grounded contact time without resetting on grounded horizontal moves, and resets grounded/gravity timers on lift-off (R04 / A3)', () => {
    const board = createEmptyBoard();
    // Create a shelf at row 10 under cols 3, 4, 5 so T at (3, 8) (cells at rows 8 and 9, cols 3..5) is grounded,
    // while cols 6, 7, 8 on row 10 are empty so moving right twice lifts off into airborne space!
    board[10]![3] = 'I';
    board[10]![4] = 'I';

    const engine = createGameEngine({
      random: createIdentityBagRandom(),
      fixture: buildRunningFixture({
        board,
        activePiece: { id: 'T', orientation: 0, x: 3, y: 8 },
        gravityElapsedMs: 200,
        groundedElapsedMs: 0,
      }),
    });

    expect(engine.getSnapshot().isGrounded).toBe(true);

    // Advance 300 ms while grounded: groundedElapsedMs becomes 300
    const grounded300 = engine.advanceTime(300);
    expect(grounded300.groundedElapsedMs).toBe(300);

    // Move right 1 col to x = 4 (cells on row 9 are cols 4, 5, 6 -> col 4 is still over board[10][4] = 'I', so STILL grounded!)
    const stillGrounded = engine.dispatch('move-right');
    expect(stillGrounded.activePiece?.x).toBe(4);
    expect(stillGrounded.isGrounded).toBe(true);
    // Grounded timer MUST NOT reset on grounded horizontal move
    expect(stillGrounded.groundedElapsedMs).toBe(300);

    // Move right 1 more col to x = 5 (cells on row 9 are cols 5, 6, 7 -> row 10 cols 5, 6, 7 are all empty -> AIRBORNE!)
    const liftedOff = engine.dispatch('move-right');
    expect(liftedOff.activePiece?.x).toBe(5);
    expect(liftedOff.isGrounded).toBe(false);
    // Becoming airborne clears grounded time and resets gravity timing!
    expect(liftedOff.groundedElapsedMs).toBe(0);
    expect(liftedOff.gravityElapsedMs).toBe(0);
  });

  it('rejects invalid actions with TypeError and invalid elapsed times with RangeError before mutating state (R11 / A9)', () => {
    const engine = createGameEngine({
      random: createIdentityBagRandom(),
      fixture: buildRunningFixture({
        activePiece: { id: 'T', orientation: 0, x: 3, y: 2 },
        gravityElapsedMs: 120,
      }),
    });

    expect(() => engine.dispatch('invalid-action' as unknown as GameAction)).toThrow(TypeError);
    expect(() => engine.advanceTime(-1)).toThrow(RangeError);
    expect(() => engine.advanceTime(Number.NaN)).toThrow(RangeError);
    expect(() => engine.advanceTime(Number.POSITIVE_INFINITY)).toThrow(RangeError);

    // State must remain completely unchanged
    const snap = engine.getSnapshot();
    expect(snap.activePiece?.x).toBe(3);
    expect(snap.activePiece?.y).toBe(2);
    expect(snap.gravityElapsedMs).toBe(120);
  });
});
