import { ALL_PIECE_IDS, type PieceId, type RandomSource } from './types.ts';

/**
 * C2 Seven-bag randomization and preview queue (R03, R11, A2, A9).
 *
 * Randomness ownership:
 * - Each game session owns its own SevenBagQueue instance; no module-global state exists.
 * - Production composition injects `Math.random`; tests inject deterministic sample functions.
 * - Every random sample must be finite and in [0, 1). Invalid samples throw RangeError before
 *   mutating the active bag or queue index.
 */

export interface SevenBagQueue {
  /**
   * Returns the next piece that will be produced by `drawNext()` without consuming it.
   */
  peekNext(): PieceId;

  /**
   * Consumes and returns the next piece from the current bag, refilling atomically
   * when the bag is exhausted so `peekNext()` always reflects the upcoming draw.
   */
  drawNext(): PieceId;

  /**
   * Returns an isolated copy of the remaining pieces in the current bag from the draw cursor.
   */
  getRemainingInBag(): readonly PieceId[];
}

function sampleUnitInterval(random: RandomSource): number {
  if (typeof random !== 'function') {
    throw new TypeError('Random source must be a function returning a number in [0, 1).');
  }
  const value = random();
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError(`Random sample must be a finite number in [0, 1); received ${String(value)}.`);
  }
  return value;
}

/**
 * Shuffles a fresh copy of `['I', 'O', 'T', 'J', 'L', 'S', 'Z']` using descending
 * Fisher–Yates: for i = 6 down to 1, j = floor(random() * (i + 1)), swap(i, j) (R03).
 */
export function shuffleSevenBag(random: RandomSource): PieceId[] {
  const bag: PieceId[] = [...ALL_PIECE_IDS];
  for (let i = bag.length - 1; i >= 1; i -= 1) {
    const sample = sampleUnitInterval(random);
    const j = Math.floor(sample * (i + 1));
    const temp = bag[i]!;
    bag[i] = bag[j]!;
    bag[j] = temp;
  }
  return bag;
}

/**
 * Creates an isolated session-owned seven-bag queue (R03).
 */
export function createSevenBagQueue(random: RandomSource = Math.random): SevenBagQueue {
  let currentBag: PieceId[] = shuffleSevenBag(random);
  let cursor = 0;

  return {
    peekNext(): PieceId {
      return currentBag[cursor]!;
    },

    drawNext(): PieceId {
      const drawn = currentBag[cursor]!;
      if (cursor + 1 < currentBag.length) {
        cursor += 1;
        return drawn;
      }
      // Refill atomically before mutating currentBag or cursor so an invalid
      // random sample throws RangeError without partial queue mutation (R03 / R11).
      const nextBag = shuffleSevenBag(random);
      currentBag = nextBag;
      cursor = 0;
      return drawn;
    },

    getRemainingInBag(): readonly PieceId[] {
      return currentBag.slice(cursor);
    },
  };
}
