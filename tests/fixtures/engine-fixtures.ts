import { createEmptyBoard } from '../../src/game/board.ts';
import type {
  BoardGrid,
  EngineFixture,
  Orientation,
  PieceId,
  RandomSource,
} from '../../src/game/types.ts';

/**
 * Deterministic test fixture builders for engine and browser harness scenarios.
 * Never imported by production modules (layout.md / R11).
 */

/**
 * Creates a deterministic random source that cycles through the supplied [0, 1) samples.
 */
export function createSequenceRandom(samples: readonly number[] = [0.999999]): RandomSource {
  let index = 0;
  return () => {
    const value = samples[index % samples.length]!;
    index += 1;
    return value;
  };
}

/**
 * Creates an identity-order seven-bag random source (produces ['I','O','T','J','L','S','Z']).
 */
export function createIdentityBagRandom(): RandomSource {
  return () => 0.999999;
}

export interface RunningFixtureOverrides {
  readonly board?: BoardGrid;
  readonly activePiece?: {
    readonly id: PieceId;
    readonly orientation?: Orientation;
    readonly x?: number;
    readonly y?: number;
  };
  readonly heldPiece?: PieceId | null;
  readonly holdUsed?: boolean;
  readonly score?: number;
  readonly lines?: number;
  readonly level?: number;
  readonly gravityElapsedMs?: number;
  readonly groundedElapsedMs?: number;
  readonly lifecycle?: 'running' | 'paused';
}

/**
 * Builds a valid running/paused EngineFixture with sensible defaults.
 */
export function buildRunningFixture(overrides: RunningFixtureOverrides = {}): EngineFixture {
  const board = overrides.board ?? createEmptyBoard();
  const lines = overrides.lines ?? 0;
  const level = overrides.level ?? 1 + Math.floor(lines / 10);
  const activeSpec = overrides.activePiece ?? { id: 'T', orientation: 0, x: 3, y: 0 };

  return {
    lifecycle: overrides.lifecycle ?? 'running',
    board,
    activePiece: {
      id: activeSpec.id,
      orientation: activeSpec.orientation ?? 0,
      x: activeSpec.x ?? 3,
      y: activeSpec.y ?? 0,
    },
    heldPiece: overrides.heldPiece ?? null,
    holdUsed: overrides.holdUsed ?? false,
    score: overrides.score ?? 0,
    lines,
    level,
    gravityElapsedMs: overrides.gravityElapsedMs ?? 0,
    groundedElapsedMs: overrides.groundedElapsedMs ?? 0,
  };
}
