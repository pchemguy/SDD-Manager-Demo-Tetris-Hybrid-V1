import { expect, test } from '@playwright/test';

/**
 * T-001 bounded browser capability probe (R12/A8).
 * Demonstrates Chromium, Firefox, and WebKit binary launches, actual Canvas 2D
 * pixel rasterization, and repeated browser context/page session lifecycle.
 * Note: This probe establishes tooling and browser capabilities only; full gameplay
 * acceptance is verified in T-006 and subsequent milestones.
 */
test.describe('T-001 browser capability and startup probe', () => {
  test('mounts the production skeleton and rasterizes visible Canvas 2D pixels', async ({ page }) => {
    await page.goto('/');

    const canvas = page.getByTestId('board-canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('aria-label', /tetris board/i);

    const status = page.getByTestId('lifecycle-status');
    await expect(status).toBeVisible();

    const pixelSample = await canvas.evaluate((el) => {
      if (!(el instanceof HTMLCanvasElement)) {
        return null;
      }
      const ctx = el.getContext('2d');
      if (!ctx) {
        return null;
      }
      const cellInterior = ctx.getImageData(15, 15, 1, 1).data;
      const borderPixel = ctx.getImageData(0, 0, 1, 1).data;
      return {
        width: el.width,
        height: el.height,
        cellInterior: Array.from(cellInterior),
        borderPixel: Array.from(borderPixel),
      };
    });

    expect(pixelSample).not.toBeNull();
    expect(pixelSample!.width).toBeGreaterThanOrEqual(200);
    expect(pixelSample!.height).toBeGreaterThanOrEqual(400);
    // Verify opaque rasterized pixels on the Canvas 2D surface
    expect(pixelSample!.cellInterior[3]).toBe(255);
    expect(pixelSample!.borderPixel[3]).toBe(255);
    // Verify border/grid contrast against cell interior fill
    expect(pixelSample!.borderPixel.slice(0, 3)).not.toEqual(pixelSample!.cellInterior.slice(0, 3));
  });

  test('supports repeated browser contexts and page sessions cleanly', async ({ browser }) => {
    for (let sessionIndex = 0; sessionIndex < 2; sessionIndex += 1) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const page = await context.newPage();
      await page.goto('/');

      const canvas = page.getByTestId('board-canvas');
      await expect(canvas).toBeVisible();

      const alpha = await canvas.evaluate((el) => {
        if (!(el instanceof HTMLCanvasElement)) return 0;
        const ctx = el.getContext('2d');
        if (!ctx) return 0;
        return ctx.getImageData(15, 15, 1, 1).data[3];
      });
      expect(alpha).toBe(255);

      await page.close();
      await context.close();
    }
  });
});
