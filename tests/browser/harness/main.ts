import '../../../src/styles.css';
import { createTetrisApp, type TetrisAppOptions } from '../../../src/app.ts';
import { createEmptyBoard } from '../../../src/game/board.ts';
import { buildRunningFixture, createIdentityBagRandom } from '../../fixtures/engine-fixtures.ts';

/**
 * Isolated browser-only test harness entry (layout.md / R11 / R12).
 * Composes the real C7/C5/C6/C3 application with validated deterministic fixtures
 * selected by URL query parameter (`?scenario=...`). Excluded from production builds
 * and exposes no window debug mutation globals.
 */

function resolveScenarioOptions(scenario: string | null): TetrisAppOptions {
  const random = createIdentityBagRandom();

  switch (scenario) {
    case 'line-clear': {
      const board = createEmptyBoard();
      // Occupy cols 0..2 and 7..9 on row 19 so horizontal 'I' at cols 3..6 completes row 19
      board[19]![0] = 'J';
      board[19]![1] = 'J';
      board[19]![2] = 'J';
      board[19]![7] = 'L';
      board[19]![8] = 'L';
      board[19]![9] = 'L';
      return {
        random,
        fixture: buildRunningFixture({
          board,
          // 'I' at (3, 17) occupies row 18 cols 3..6 (1 cell above row 19)
          activePiece: { id: 'I', orientation: 0, x: 3, y: 17 },
        }),
      };
    }

    case 'top-out': {
      const board = createEmptyBoard();
      // Occupy (4, 1) where the next spawned 'I' piece (cells (3,1)..(6,1)) will collide
      board[1]![4] = 'Z';
      return {
        random,
        fixture: buildRunningFixture({
          board,
          // 'O' at (0, 17) occupies rows 17..18 cols 0..1 (1 cell above the floor at y = 18)
          activePiece: { id: 'O', orientation: 0, x: 0, y: 17 },
        }),
      };
    }

    case 'deterministic':
    default:
      return { random };
  }
}

const params = new URLSearchParams(window.location.search);
const scenario = params.get('scenario');
const root = document.getElementById('app');
createTetrisApp(root, resolveScenarioOptions(scenario));
