import {
  ALL_PIECE_IDS,
  BOARD_COLS,
  type ActivePieceState,
  type Orientation,
  type PieceId,
  type Point,
  type RotationDirection,
} from './types.ts';

/**
 * C1 Piece geometry (R01).
 * Owns canonical piece sizes, spawn local coordinates, CW/CCW rotation transforms,
 * and ordered horizontal wall-kick candidate offsets. Zero DOM or timer dependencies.
 */

interface PieceDefinition {
  readonly size: number;
  readonly spawnCells: readonly Point[];
}

const PIECE_DEFINITIONS: Record<PieceId, PieceDefinition> = {
  I: {
    size: 4,
    spawnCells: [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ],
  },
  O: {
    size: 2,
    spawnCells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
  T: {
    size: 3,
    spawnCells: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },
  J: {
    size: 3,
    spawnCells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },
  L: {
    size: 3,
    spawnCells: [
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },
  S: {
    size: 3,
    spawnCells: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
  Z: {
    size: 3,
    spawnCells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },
};

/**
 * Ordered horizontal wall-kick candidate offsets tested for non-O rotations (R01).
 */
export const HORIZONTAL_KICK_OFFSETS: readonly Point[] = [
  { x: 0, y: 0 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: -2, y: 0 },
  { x: 2, y: 0 },
] as const;

export function isPieceId(value: unknown): value is PieceId {
  return typeof value === 'string' && (ALL_PIECE_IDS as readonly string[]).includes(value);
}

export function isOrientation(value: unknown): value is Orientation {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

export function getPieceSize(id: PieceId): number {
  return PIECE_DEFINITIONS[id].size;
}

export function getSpawnOrigin(id: PieceId): Point {
  const size = PIECE_DEFINITIONS[id].size;
  return {
    x: Math.floor((BOARD_COLS - size) / 2),
    y: 0,
  };
}

function rotatePointCw(pt: Point, size: number): Point {
  return {
    x: size - 1 - pt.y,
    y: pt.x,
  };
}

export function rotateOrientation(
  id: PieceId,
  orientation: Orientation,
  direction: RotationDirection,
): Orientation {
  if (id === 'O') {
    return 0;
  }
  const delta = direction === 'cw' ? 1 : 3;
  return ((orientation + delta) % 4) as Orientation;
}

/**
 * Returns a fresh array of local cell coordinates for the given piece and orientation (R01).
 * Clockwise step maps (x, y) -> (N - 1 - y, x); counterclockwise maps (x, y) -> (y, N - 1 - x).
 */
export function getLocalCells(id: PieceId, orientation: Orientation = 0): Point[] {
  const def = PIECE_DEFINITIONS[id];
  const steps = id === 'O' ? 0 : orientation;
  let cells = def.spawnCells.map((pt) => ({ x: pt.x, y: pt.y }));
  for (let s = 0; s < steps; s += 1) {
    cells = cells.map((pt) => rotatePointCw(pt, def.size));
  }
  return cells;
}

/**
 * Returns a fresh array of board coordinates for a piece placement.
 */
export function getBoardCells(
  id: PieceId,
  orientation: Orientation,
  originX: number,
  originY: number,
): Point[] {
  return getLocalCells(id, orientation).map((pt) => ({
    x: originX + pt.x,
    y: originY + pt.y,
  }));
}

export function createActivePiece(
  id: PieceId,
  orientation: Orientation,
  x: number,
  y: number,
): ActivePieceState {
  const normalizedOrientation: Orientation = id === 'O' ? 0 : orientation;
  return {
    id,
    orientation: normalizedOrientation,
    x,
    y,
    cells: getBoardCells(id, normalizedOrientation, x, y),
  };
}

export function createSpawnPiece(id: PieceId): ActivePieceState {
  const origin = getSpawnOrigin(id);
  return createActivePiece(id, 0, origin.x, origin.y);
}

export function cloneActivePiece(piece: ActivePieceState): ActivePieceState {
  return {
    id: piece.id,
    orientation: piece.orientation,
    x: piece.x,
    y: piece.y,
    cells: piece.cells.map((pt) => ({ x: pt.x, y: pt.y })),
  };
}

/**
 * Generates ordered candidate placements for a rotation request (R01).
 * O rotation is an unchanged no-op; non-O pieces test (0,0), (-1,0), (+1,0), (-2,0), (+2,0).
 */
export function getRotationCandidates(
  piece: Pick<ActivePieceState, 'id' | 'orientation' | 'x' | 'y'>,
  direction: RotationDirection,
): ActivePieceState[] {
  if (piece.id === 'O') {
    return [createActivePiece('O', 0, piece.x, piece.y)];
  }
  const nextOrientation = rotateOrientation(piece.id, piece.orientation, direction);
  return HORIZONTAL_KICK_OFFSETS.map((offset) =>
    createActivePiece(piece.id, nextOrientation, piece.x + offset.x, piece.y + offset.y),
  );
}
