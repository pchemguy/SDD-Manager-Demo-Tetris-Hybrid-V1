import { describe, expect, it } from 'vitest';
import {
  HORIZONTAL_KICK_OFFSETS,
  createActivePiece,
  createSpawnPiece,
  getLocalCells,
  getPieceSize,
  getRotationCandidates,
  getSpawnOrigin,
  isOrientation,
  isPieceId,
  rotateOrientation,
} from '../../src/game/pieces.ts';
import { ALL_PIECE_IDS, type Orientation, type PieceId } from '../../src/game/types.ts';

/**
 * Unit tests for C1 piece geometry (R01, A1).
 * Verifies spawn coordinates, bounding square sizes, CW/CCW rotation transforms,
 * four-turn restoration, O-piece no-op rotation, and ordered horizontal kick candidates.
 */
describe('C1 pieces: spawn geometry and rotation transforms (R01 / A1)', () => {
  it('defines exact square sizes, spawn origins, and local spawn coordinates for all seven pieces', () => {
    const expectedSpawns: Record<PieceId, { size: number; origin: { x: number; y: number }; local: Array<{ x: number; y: number }> }> = {
      I: {
        size: 4,
        origin: { x: 3, y: 0 },
        local: [
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 3, y: 1 },
        ],
      },
      O: {
        size: 2,
        origin: { x: 4, y: 0 },
        local: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
        ],
      },
      T: {
        size: 3,
        origin: { x: 3, y: 0 },
        local: [
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
        ],
      },
      J: {
        size: 3,
        origin: { x: 3, y: 0 },
        local: [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
        ],
      },
      L: {
        size: 3,
        origin: { x: 3, y: 0 },
        local: [
          { x: 2, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
        ],
      },
      S: {
        size: 3,
        origin: { x: 3, y: 0 },
        local: [
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
        ],
      },
      Z: {
        size: 3,
        origin: { x: 3, y: 0 },
        local: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
        ],
      },
    };

    for (const id of ALL_PIECE_IDS) {
      const spec = expectedSpawns[id];
      expect(getPieceSize(id)).toBe(spec.size);
      expect(getSpawnOrigin(id)).toEqual(spec.origin);
      expect(getLocalCells(id, 0)).toEqual(spec.local);

      const spawned = createSpawnPiece(id);
      expect(spawned.id).toBe(id);
      expect(spawned.orientation).toBe(0);
      expect(spawned.x).toBe(spec.origin.x);
      expect(spawned.y).toBe(spec.origin.y);
      expect(spawned.cells).toEqual(
        spec.local.map((pt) => ({ x: spec.origin.x + pt.x, y: spec.origin.y + pt.y })),
      );
    }
  });

  it('maps local cells by (N-1-y, x) for clockwise and (y, N-1-x) for counterclockwise rotation', () => {
    // T piece (N = 3): spawn (1,0), (0,1), (1,1), (2,1)
    // CW once (orientation 1): (3-1-0, 1)=(2,1), (3-1-1,0)=(1,0), (3-1-1,1)=(1,1), (3-1-1,2)=(1,2)
    expect(getLocalCells('T', 1)).toEqual([
      { x: 2, y: 1 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);

    // CCW once (orientation 3): (0, 3-1-1)=(0,1), (1, 3-1-0)=(1,2), (1, 3-1-1)=(1,1), (1, 3-1-2)=(1,0)
    expect(getLocalCells('T', 3)).toEqual([
      { x: 0, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
    ]);

    // I piece (N = 4): spawn (0,1), (1,1), (2,1), (3,1)
    // CW once (orientation 1): (2,0), (2,1), (2,2), (2,3)
    expect(getLocalCells('I', 1)).toEqual([
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ]);
    // CCW once (orientation 3): (1,3), (1,2), (1,1), (1,0)
    expect(getLocalCells('I', 3)).toEqual([
      { x: 1, y: 3 },
      { x: 1, y: 2 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
    ]);
  });

  it('restores original orientation and local cells after four CW or four CCW turns', () => {
    for (const id of ALL_PIECE_IDS) {
      let cwOrientation: Orientation = 0;
      let ccwOrientation: Orientation = 0;
      for (let step = 0; step < 4; step += 1) {
        cwOrientation = rotateOrientation(id, cwOrientation, 'cw');
        ccwOrientation = rotateOrientation(id, ccwOrientation, 'ccw');
      }
      expect(cwOrientation).toBe(0);
      expect(ccwOrientation).toBe(0);
      expect(getLocalCells(id, cwOrientation)).toEqual(getLocalCells(id, 0));
      expect(getLocalCells(id, ccwOrientation)).toEqual(getLocalCells(id, 0));
    }
  });

  it('treats O rotation as an unchanged no-op with orientation 0 and a single unchanged candidate', () => {
    expect(rotateOrientation('O', 0, 'cw')).toBe(0);
    expect(rotateOrientation('O', 0, 'ccw')).toBe(0);

    const oPiece = createActivePiece('O', 0, 4, 2);
    const cwCandidates = getRotationCandidates(oPiece, 'cw');
    const ccwCandidates = getRotationCandidates(oPiece, 'ccw');
    expect(cwCandidates).toHaveLength(1);
    expect(cwCandidates[0]).toEqual(oPiece);
    expect(ccwCandidates).toHaveLength(1);
    expect(ccwCandidates[0]).toEqual(oPiece);
  });

  it('produces five horizontal wall-kick candidates in exact order (0,0), (-1,0), (+1,0), (-2,0), (+2,0) for non-O pieces', () => {
    expect(HORIZONTAL_KICK_OFFSETS).toEqual([
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 0 },
      { x: 2, y: 0 },
    ]);

    const tPiece = createActivePiece('T', 0, 3, 5);
    const candidates = getRotationCandidates(tPiece, 'cw');
    expect(candidates).toHaveLength(5);
    expect(candidates.map((c) => ({ x: c.x, y: c.y, orientation: c.orientation }))).toEqual([
      { x: 3, y: 5, orientation: 1 },
      { x: 2, y: 5, orientation: 1 },
      { x: 4, y: 5, orientation: 1 },
      { x: 1, y: 5, orientation: 1 },
      { x: 5, y: 5, orientation: 1 },
    ]);
  });

  it('validates piece identifiers and orientations accurately', () => {
    for (const id of ALL_PIECE_IDS) {
      expect(isPieceId(id)).toBe(true);
    }
    expect(isPieceId('X')).toBe(false);
    expect(isPieceId(null)).toBe(false);

    expect(isOrientation(0)).toBe(true);
    expect(isOrientation(1)).toBe(true);
    expect(isOrientation(2)).toBe(true);
    expect(isOrientation(3)).toBe(true);
    expect(isOrientation(4)).toBe(false);
    expect(isOrientation(-1)).toBe(false);
    expect(isOrientation(1.5)).toBe(false);
  });
});
