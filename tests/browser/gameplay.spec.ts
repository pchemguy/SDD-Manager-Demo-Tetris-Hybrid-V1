import { expect, test, type Page } from '@playwright/test';

/**
 * Cross-engine browser acceptance tests for Milestone 1.1 playable core (T-006: R02, R09, R10, R12, A7, A8).
 * Exercises native keyboard and button events, real requestAnimationFrame timing,
 * DOM status assertions, and actual Canvas 2D pixel inspection across Chromium, Firefox, and WebKit.
 */

const EMPTY_CELL_RGB = [15, 23, 42]; // #0f172a

async function readCellRgb(page: Page, col: number, row: number): Promise<number[]> {
  const canvas = page.getByTestId('board-canvas');
  return canvas.evaluate(
    (el, coords) => {
      if (!(el instanceof HTMLCanvasElement)) return [0, 0, 0];
      const ctx = el.getContext('2d');
      if (!ctx) return [0, 0, 0];
      const pixelX = coords.col * 30 + 15;
      const pixelY = coords.row * 30 + 15;
      const data = ctx.getImageData(pixelX, pixelY, 1, 1).data;
      return [data[0]!, data[1]!, data[2]!];
    },
    { col, row },
  );
}

test.describe('T-006 playable browser core (Chromium, Firefox, WebKit)', () => {
  test('starts via native key/button, moves horizontally, soft-drops, locks after 500 ms, and spawns the next piece with rendered Canvas pixels', async ({
    page,
  }) => {
    await page.goto('/tests/browser/harness/index.html?scenario=deterministic');

    const status = page.getByTestId('lifecycle-status');
    const nextValue = page.getByTestId('next-piece-value');
    const overlay = page.getByTestId('lifecycle-overlay');

    await expect(status).toHaveText('Ready');
    await expect(nextValue).toHaveText('I');
    await expect(overlay).toBeVisible();

    // Cell (3, 1) is empty before starting
    expect(await readCellRgb(page, 3, 1)).toEqual(EMPTY_CELL_RGB);

    // Start the game with native Enter key
    await page.keyboard.press('Enter');
    await expect(status).toHaveText('Running');
    await expect(nextValue).toHaveText('O');
    await expect(overlay).toBeHidden();

    // Active 'I' piece spawned at (3, 0) -> occupies cells (3,1), (4,1), (5,1), (6,1)
    expect(await readCellRgb(page, 3, 1)).not.toEqual(EMPTY_CELL_RGB);
    expect(await readCellRgb(page, 2, 1)).toEqual(EMPTY_CELL_RGB);

    // Move left by 1 column using native ArrowLeft key -> occupies (2,1)..(5,1)
    await page.keyboard.press('ArrowLeft');
    expect(await readCellRgb(page, 2, 1)).not.toEqual(EMPTY_CELL_RGB);
    expect(await readCellRgb(page, 6, 1)).toEqual(EMPTY_CELL_RGB);

    // Soft-drop 18 times to reach the bottom row (row 19, cols 2..5)
    for (let step = 0; step < 18; step += 1) {
      await page.keyboard.press('ArrowDown');
    }
    expect(await readCellRgb(page, 2, 19)).not.toEqual(EMPTY_CELL_RGB);

    // Wait for the 500 ms grounded lock delay to expire via the real requestAnimationFrame loop:
    // nextPiece transitions from 'O' to 'T' once 'O' spawns at the top!
    await expect(nextValue).toHaveText('T', { timeout: 3000 });

    // Verify settled 'I' piece remains rendered on row 19 col 2 AND newly spawned 'O' piece is rendered at (4, 0)
    expect(await readCellRgb(page, 2, 19)).not.toEqual(EMPTY_CELL_RGB);
    expect(await readCellRgb(page, 4, 0)).not.toEqual(EMPTY_CELL_RGB);
  });

  test('clears a completed line after timed lock and updates rendered board and line count', async ({
    page,
  }) => {
    await page.goto('/tests/browser/harness/index.html?scenario=line-clear');

    const status = page.getByTestId('lifecycle-status');
    const lines = page.getByTestId('lines-value');

    await expect(status).toHaveText('Running');
    await expect(lines).toHaveText('0');
    // Settled cell at (0, 19) is occupied before line clear
    expect(await readCellRgb(page, 0, 19)).not.toEqual(EMPTY_CELL_RGB);

    // Soft-drop active 'I' piece 1 row into row 19 (cols 3..6) to complete the row
    await page.keyboard.press('ArrowDown');

    // Wait for 500 ms grounded lock to clear row 19 and increment lines to 1
    await expect(lines).toHaveText('1', { timeout: 3000 });

    // Row 19 col 0 is now empty because the full bottom row was cleared!
    expect(await readCellRgb(page, 0, 19)).toEqual(EMPTY_CELL_RGB);
  });

  test('transitions to game-over on a colliding post-lock spawn and restarts cleanly via the Restart button', async ({
    page,
  }) => {
    await page.goto('/tests/browser/harness/index.html?scenario=top-out');

    const status = page.getByTestId('lifecycle-status');
    const overlay = page.getByTestId('lifecycle-overlay');
    const restartButton = page.getByTestId('restart-button');

    await expect(status).toHaveText('Running');

    // Soft-drop active 'O' piece 1 row onto the floor at (0, 18)
    await page.keyboard.press('ArrowDown');

    // After 500 ms grounded lock, next piece 'I' collides with settled cell at (4, 1) -> Game Over
    await expect(status).toHaveText('Game Over', { timeout: 3000 });
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText('Game Over');

    // Click native Restart button to start a fresh running session
    await restartButton.click();
    await expect(status).toHaveText('Running');
    await expect(overlay).toBeHidden();
    // Settled cell from prior game at (0, 19) is cleared on restart
    expect(await readCellRgb(page, 0, 19)).toEqual(EMPTY_CELL_RGB);
  });
});
