import { getLocalCells } from '../game/pieces.ts';
import {
  BOARD_COLS,
  BOARD_ROWS,
  type GameSnapshot,
  type PieceId,
  type SessionLifecycle,
} from '../game/types.ts';

/**
 * C6 Presentation view (Milestone 1.1 core: R10 / A8).
 * Owns the HTML shell, accessible status/buttons, 10x20 board Canvas 2D rendering,
 * and next-piece preview rendering. Consumes isolated GameSnapshots without mutating
 * engine state or calculating gameplay transitions.
 */

export const CELL_SIZE = 30;
const PREVIEW_CELL_SIZE = 20;
const PREVIEW_GRID_SIZE = 4;

export const PIECE_COLORS: Record<PieceId, string> = {
  I: '#06b6d4',
  O: '#eab308',
  T: '#a855f7',
  J: '#3b82f6',
  L: '#f97316',
  S: '#22c55e',
  Z: '#ef4444',
};

export interface ViewCallbacks {
  readonly onStart: () => void;
  readonly onRestart: () => void;
}

export interface TetrisView {
  readonly shellElement: HTMLElement;
  readonly boardCanvas: HTMLCanvasElement;
  readonly startButton: HTMLButtonElement;
  readonly restartButton: HTMLButtonElement;
  render(snapshot: GameSnapshot): void;
  dispose(): void;
}

function formatLifecycleLabel(lifecycle: SessionLifecycle): string {
  switch (lifecycle) {
    case 'ready':
      return 'Ready';
    case 'running':
      return 'Running';
    case 'paused':
      return 'Paused';
    case 'game-over':
      return 'Game Over';
  }
}

function formatOverlayMessage(lifecycle: SessionLifecycle): string {
  switch (lifecycle) {
    case 'ready':
      return 'Press Start or Enter to play';
    case 'paused':
      return 'Paused';
    case 'game-over':
      return 'Game Over — Press Restart to play again';
    case 'running':
      return '';
  }
}

export function createTetrisView(root: HTMLElement, callbacks: ViewCallbacks): TetrisView {
  const doc = root.ownerDocument;
  root.innerHTML = '';

  const shell = doc.createElement('div');
  shell.className = 'tetris-shell';
  shell.tabIndex = -1;
  shell.setAttribute('data-testid', 'game-shell');

  const boardSection = doc.createElement('section');
  boardSection.className = 'board-section';

  const frame = doc.createElement('div');
  frame.className = 'board-canvas-frame';

  const boardCanvas = doc.createElement('canvas');
  boardCanvas.width = BOARD_COLS * CELL_SIZE;
  boardCanvas.height = BOARD_ROWS * CELL_SIZE;
  boardCanvas.setAttribute('data-testid', 'board-canvas');
  boardCanvas.setAttribute('aria-label', 'Tetris board (10 columns by 20 rows)');

  const boardCtx = typeof boardCanvas.getContext === 'function' ? boardCanvas.getContext('2d') : null;
  if (!boardCtx) {
    const errorBox = doc.createElement('div');
    errorBox.className = 'init-error';
    errorBox.setAttribute('data-testid', 'init-error');
    errorBox.setAttribute('role', 'alert');
    errorBox.textContent = 'Unable to initialize Tetris: Canvas 2D rendering is unavailable.';
    root.appendChild(errorBox);
    throw new Error('Canvas 2D rendering context is unavailable.');
  }

  const overlay = doc.createElement('div');
  overlay.className = 'lifecycle-overlay';
  overlay.setAttribute('data-testid', 'lifecycle-overlay');

  frame.appendChild(boardCanvas);
  frame.appendChild(overlay);
  boardSection.appendChild(frame);

  const statusPanel = doc.createElement('aside');
  statusPanel.className = 'status-panel';

  const title = doc.createElement('h1');
  title.className = 'game-title';
  title.textContent = 'Tetris';

  const statusRow = doc.createElement('div');
  statusRow.className = 'status-row';
  const statusLabel = doc.createElement('span');
  statusLabel.className = 'metric-label';
  statusLabel.textContent = 'Status: ';
  const statusValue = doc.createElement('span');
  statusValue.setAttribute('data-testid', 'lifecycle-status');
  statusValue.setAttribute('role', 'status');
  statusValue.setAttribute('aria-live', 'polite');
  statusValue.textContent = 'Ready';
  statusRow.appendChild(statusLabel);
  statusRow.appendChild(statusValue);

  const metricsList = doc.createElement('dl');
  metricsList.className = 'metrics-list';

  function createMetricItem(label: string, testId: string, initial: string): HTMLElement {
    const wrapper = doc.createElement('div');
    wrapper.className = 'metric-item';
    const dt = doc.createElement('dt');
    dt.textContent = label;
    const dd = doc.createElement('dd');
    dd.setAttribute('data-testid', testId);
    dd.textContent = initial;
    wrapper.appendChild(dt);
    wrapper.appendChild(dd);
    metricsList.appendChild(wrapper);
    return dd;
  }

  const scoreValue = createMetricItem('Score', 'score-value', '0');
  const linesValue = createMetricItem('Lines', 'lines-value', '0');
  const levelValue = createMetricItem('Level', 'level-value', '1');

  const previewBox = doc.createElement('div');
  previewBox.className = 'preview-box';
  const previewHeader = doc.createElement('div');
  previewHeader.className = 'preview-header';
  const previewTitle = doc.createElement('span');
  previewTitle.textContent = 'Next: ';
  const nextPieceValue = doc.createElement('strong');
  nextPieceValue.setAttribute('data-testid', 'next-piece-value');
  nextPieceValue.textContent = 'I';
  previewHeader.appendChild(previewTitle);
  previewHeader.appendChild(nextPieceValue);

  const nextCanvas = doc.createElement('canvas');
  nextCanvas.width = PREVIEW_GRID_SIZE * PREVIEW_CELL_SIZE;
  nextCanvas.height = PREVIEW_GRID_SIZE * PREVIEW_CELL_SIZE;
  nextCanvas.setAttribute('data-testid', 'next-piece-canvas');
  nextCanvas.setAttribute('aria-label', 'Next piece preview');
  const nextCtx = typeof nextCanvas.getContext === 'function' ? nextCanvas.getContext('2d') : null;

  previewBox.appendChild(previewHeader);
  previewBox.appendChild(nextCanvas);

  const controlsGroup = doc.createElement('div');
  controlsGroup.className = 'controls-group';

  const startButton = doc.createElement('button');
  startButton.type = 'button';
  startButton.className = 'control-button';
  startButton.setAttribute('data-testid', 'start-button');
  startButton.setAttribute('aria-label', 'Start game');
  startButton.textContent = 'Start';

  const restartButton = doc.createElement('button');
  restartButton.type = 'button';
  restartButton.className = 'control-button';
  restartButton.setAttribute('data-testid', 'restart-button');
  restartButton.setAttribute('aria-label', 'Restart game');
  restartButton.textContent = 'Restart';

  const handleStartClick = (): void => {
    callbacks.onStart();
  };
  const handleRestartClick = (): void => {
    callbacks.onRestart();
  };

  startButton.addEventListener('click', handleStartClick);
  restartButton.addEventListener('click', handleRestartClick);

  controlsGroup.appendChild(startButton);
  controlsGroup.appendChild(restartButton);

  const helpBox = doc.createElement('div');
  helpBox.className = 'help-box';
  helpBox.setAttribute('data-testid', 'controls-help');
  helpBox.innerHTML = [
    '<strong>Controls (Milestone 1.1 Core)</strong>',
    '<ul>',
    '<li><kbd>Enter</kbd> or <strong>Start</strong>: Start game</li>',
    '<li><kbd>ArrowLeft</kbd> / <kbd>ArrowRight</kbd>: Move horizontally</li>',
    '<li><kbd>ArrowDown</kbd>: Soft drop</li>',
    '<li><strong>Restart</strong> button: New session</li>',
    '</ul>',
  ].join('');

  statusPanel.appendChild(title);
  statusPanel.appendChild(statusRow);
  statusPanel.appendChild(metricsList);
  statusPanel.appendChild(previewBox);
  statusPanel.appendChild(controlsGroup);
  statusPanel.appendChild(helpBox);

  shell.appendChild(boardSection);
  shell.appendChild(statusPanel);
  root.appendChild(shell);

  function renderBoard(snapshot: GameSnapshot): void {
    const width = boardCanvas.width;
    const height = boardCanvas.height;

    // 1. Fill board background
    boardCtx!.fillStyle = '#0f172a';
    boardCtx!.fillRect(0, 0, width, height);

    // 2. Draw cell grid lines
    boardCtx!.fillStyle = '#334155';
    for (let col = 0; col <= BOARD_COLS; col += 1) {
      const x = Math.min(width - 1, col * CELL_SIZE);
      boardCtx!.fillRect(x, 0, 1, height);
    }
    for (let row = 0; row <= BOARD_ROWS; row += 1) {
      const y = Math.min(height - 1, row * CELL_SIZE);
      boardCtx!.fillRect(0, y, width, 1);
    }

    // 3. Draw settled board cells
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      const boardRow = snapshot.board[row];
      if (!boardRow) continue;
      for (let col = 0; col < BOARD_COLS; col += 1) {
        const cell = boardRow[col];
        if (cell) {
          drawCell(boardCtx!, col, row, CELL_SIZE, PIECE_COLORS[cell]);
        }
      }
    }

    // 4. Draw active piece cells
    if (snapshot.activePiece) {
      const color = PIECE_COLORS[snapshot.activePiece.id];
      for (const pt of snapshot.activePiece.cells) {
        if (pt.x >= 0 && pt.x < BOARD_COLS && pt.y >= 0 && pt.y < BOARD_ROWS) {
          drawCell(boardCtx!, pt.x, pt.y, CELL_SIZE, color);
        }
      }
    }

    // 5. Draw 2px outer border so edge pixels remain distinct
    boardCtx!.fillStyle = '#38bdf8';
    boardCtx!.fillRect(0, 0, width, 2);
    boardCtx!.fillRect(0, height - 2, width, 2);
    boardCtx!.fillRect(0, 0, 2, height);
    boardCtx!.fillRect(width - 2, 0, 2, height);
  }

  function renderPreview(nextPiece: PieceId): void {
    if (!nextCtx) return;
    const width = nextCanvas.width;
    const height = nextCanvas.height;
    nextCtx.fillStyle = '#0f172a';
    nextCtx.fillRect(0, 0, width, height);

    const cells = getLocalCells(nextPiece, 0);
    const color = PIECE_COLORS[nextPiece];
    for (const pt of cells) {
      drawCell(nextCtx, pt.x, pt.y, PREVIEW_CELL_SIZE, color);
    }
  }

  return {
    shellElement: shell,
    boardCanvas,
    startButton,
    restartButton,

    render(snapshot: GameSnapshot): void {
      statusValue.textContent = formatLifecycleLabel(snapshot.lifecycle);
      scoreValue.textContent = String(snapshot.score);
      linesValue.textContent = String(snapshot.lines);
      levelValue.textContent = String(snapshot.level);
      nextPieceValue.textContent = snapshot.nextPiece;

      const overlayMsg = formatOverlayMessage(snapshot.lifecycle);
      overlay.textContent = overlayMsg;
      overlay.style.display = overlayMsg ? 'flex' : 'none';
      overlay.setAttribute('data-lifecycle', snapshot.lifecycle);

      startButton.disabled = snapshot.lifecycle !== 'ready';

      renderBoard(snapshot);
      renderPreview(snapshot.nextPiece);
    },

    dispose(): void {
      startButton.removeEventListener('click', handleStartClick);
      restartButton.removeEventListener('click', handleRestartClick);
      root.innerHTML = '';
    },
  };
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  size: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(col * size + 2, row * size + 2, size - 3, size - 3);
}
