/**
 * C7 Composition boundary (T-001 production skeleton).
 * Verifies the mount root and Canvas 2D capability before initializing the view surface.
 * Full gameplay engine/controller/view wiring is integrated in T-006.
 */

export interface TetrisAppInstance {
  /**
   * Releases application-owned resources and DOM listeners.
   */
  dispose(): void;
}

const BOARD_COLS = 10;
const BOARD_ROWS = 20;
const CELL_SIZE = 30;

/**
 * Mounts the Tetris application skeleton into the provided root element.
 * Throws a TypeError when the root element is missing, or an Error after rendering
 * an accessible diagnostic message when Canvas 2D is unavailable (R11).
 */
export function createTetrisApp(root: HTMLElement | null): TetrisAppInstance {
  if (!root || typeof root.appendChild !== 'function') {
    throw new TypeError('Application root element is required to mount Tetris.');
  }

  root.innerHTML = '';

  const shell = root.ownerDocument.createElement('div');
  shell.className = 'tetris-shell';

  const frame = root.ownerDocument.createElement('div');
  frame.className = 'board-canvas-frame';

  const canvas = root.ownerDocument.createElement('canvas');
  canvas.width = BOARD_COLS * CELL_SIZE;
  canvas.height = BOARD_ROWS * CELL_SIZE;
  canvas.setAttribute('data-testid', 'board-canvas');
  canvas.setAttribute('aria-label', 'Tetris board (10 columns by 20 rows)');

  const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  if (!ctx) {
    const errorBox = root.ownerDocument.createElement('div');
    errorBox.className = 'init-error';
    errorBox.setAttribute('data-testid', 'init-error');
    errorBox.setAttribute('role', 'alert');
    errorBox.textContent = 'Unable to initialize Tetris: Canvas 2D rendering is unavailable.';
    root.appendChild(errorBox);
    throw new Error('Canvas 2D rendering context is unavailable.');
  }

  renderSkeletonGrid(ctx, canvas.width, canvas.height);

  frame.appendChild(canvas);

  const statusPanel = root.ownerDocument.createElement('aside');
  statusPanel.className = 'status-panel';

  const status = root.ownerDocument.createElement('div');
  status.setAttribute('data-testid', 'lifecycle-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'Ready';

  statusPanel.appendChild(status);
  shell.appendChild(frame);
  shell.appendChild(statusPanel);
  root.appendChild(shell);

  let disposed = false;
  return {
    dispose(): void {
      if (disposed) {
        return;
      }
      disposed = true;
      root.innerHTML = '';
    },
  };
}

function renderSkeletonGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  // Fill board background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // Draw cell grid lines
  ctx.fillStyle = '#334155';
  for (let col = 0; col <= BOARD_COLS; col += 1) {
    const x = Math.min(width - 1, col * CELL_SIZE);
    ctx.fillRect(x, 0, 1, height);
  }
  for (let row = 0; row <= BOARD_ROWS; row += 1) {
    const y = Math.min(height - 1, row * CELL_SIZE);
    ctx.fillRect(0, y, width, 1);
  }

  // Draw outer board border (2px) so edge pixels are visibly distinct
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(0, 0, width, 2);
  ctx.fillRect(0, height - 2, width, 2);
  ctx.fillRect(0, 0, 2, height);
  ctx.fillRect(width - 2, 0, 2, height);
}
