import { describe, expect, it } from 'vitest';
import { createSevenBagQueue, shuffleSevenBag } from '../../src/game/bag.ts';
import { ALL_PIECE_IDS, type PieceId } from '../../src/game/types.ts';

/**
 * Unit tests for C2 seven-bag randomization and preview queue (R03, R11, A2, A9).
 */
describe('C2 seven-bag randomization and preview queue (R03 / A2 / A9)', () => {
  it('shuffles [I,O,T,J,L,S,Z] using exact descending Fisher-Yates for i=6 down to 1', () => {
    // Hand-calculated trace when random() always returns 0:
    // Start: ['I', 'O', 'T', 'J', 'L', 'S', 'Z']
    // i=6, j=0: swap(6,0) -> ['Z', 'O', 'T', 'J', 'L', 'S', 'I']
    // i=5, j=0: swap(5,0) -> ['S', 'O', 'T', 'J', 'L', 'Z', 'I']
    // i=4, j=0: swap(4,0) -> ['L', 'O', 'T', 'J', 'S', 'Z', 'I']
    // i=3, j=0: swap(3,0) -> ['J', 'O', 'T', 'L', 'S', 'Z', 'I']
    // i=2, j=0: swap(2,0) -> ['T', 'O', 'J', 'L', 'S', 'Z', 'I']
    // i=1, j=0: swap(1,0) -> ['O', 'T', 'J', 'L', 'S', 'Z', 'I']
    expect(shuffleSevenBag(() => 0)).toEqual(['O', 'T', 'J', 'L', 'S', 'Z', 'I']);

    // When random() returns 0.999999, j === i at every step -> identity permutation
    expect(shuffleSevenBag(() => 0.999999)).toEqual(['I', 'O', 'T', 'J', 'L', 'S', 'Z']);

    // Mixed deterministic sequence:
    // samples: [0.5, 0.2, 0.8, 0.0, 0.7, 0.1]
    // Start: [I, O, T, J, L, S, Z]
    // i=6: floor(0.5 * 7) = 3 -> swap(6,3) -> [I, O, T, Z, L, S, J]
    // i=5: floor(0.2 * 6) = 1 -> swap(5,1) -> [I, S, T, Z, L, O, J]
    // i=4: floor(0.8 * 5) = 4 -> swap(4,4) -> [I, S, T, Z, L, O, J]
    // i=3: floor(0.0 * 4) = 0 -> swap(3,0) -> [Z, S, T, I, L, O, J]
    // i=2: floor(0.7 * 3) = 2 -> swap(2,2) -> [Z, S, T, I, L, O, J]
    // i=1: floor(0.1 * 2) = 0 -> swap(1,0) -> [S, Z, T, I, L, O, J]
    const samples = [0.5, 0.2, 0.8, 0.0, 0.7, 0.1];
    let idx = 0;
    expect(shuffleSevenBag(() => samples[idx++]!)).toEqual(['S', 'Z', 'T', 'I', 'L', 'O', 'J']);
    expect(idx).toBe(6);
  });

  it('maintains exact correspondence between peekNext() and drawNext() across multi-bag refills', () => {
    // Bag 1 uses 6 samples of 0.999999 -> ['I', 'O', 'T', 'J', 'L', 'S', 'Z']
    // Bag 2 uses 6 samples of 0.0 -> ['O', 'T', 'J', 'L', 'S', 'Z', 'I']
    // Bag 3 uses 6 samples of 0.999999 -> ['I', 'O', 'T', 'J', 'L', 'S', 'Z'] (note 'I' at end of Bag 2 and start of Bag 3!)
    const samples = [
      ...Array.from({ length: 6 }, () => 0.999999),
      ...Array.from({ length: 6 }, () => 0),
      ...Array.from({ length: 6 }, () => 0.999999),
    ];
    let cursor = 0;
    const queue = createSevenBagQueue(() => samples[cursor++] ?? 0);

    const drawn: PieceId[] = [];
    for (let i = 0; i < 21; i += 1) {
      const previewed = queue.peekNext();
      const next = queue.drawNext();
      expect(next).toBe(previewed);
      drawn.push(next);
    }

    const bag1 = drawn.slice(0, 7);
    const bag2 = drawn.slice(7, 14);
    const bag3 = drawn.slice(14, 21);

    expect(bag1).toEqual(['I', 'O', 'T', 'J', 'L', 'S', 'Z']);
    expect(bag2).toEqual(['O', 'T', 'J', 'L', 'S', 'Z', 'I']);
    expect(bag3).toEqual(['I', 'O', 'T', 'J', 'L', 'S', 'Z']);

    // Every 7-draw bag is a permutation of all 7 pieces
    for (const bag of [bag1, bag2, bag3]) {
      expect([...bag].sort()).toEqual([...ALL_PIECE_IDS].sort());
    }
    // Concatenated bags can repeat across boundary (end of bag2 is 'I', start of bag3 is 'I')
    expect(bag2[6]).toBe('I');
    expect(bag3[0]).toBe('I');
  });

  it('rejects out-of-range or non-finite random samples with RangeError without partial bag mutation (R03 / A9)', () => {
    for (const invalidSample of [-0.0001, -1, 1, 1.0001, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() => shuffleSevenBag(() => invalidSample)).toThrow(RangeError);
      expect(() => createSevenBagQueue(() => invalidSample)).toThrow(RangeError);
    }

    // Verify atomic refill: 6 valid samples initialize bag 1; 6 draws leave 1 piece ('Z') in bag 1.
    // On the 7th draw, refill runs 3 valid samples and then hits an invalid sample (1.0).
    // Must throw RangeError AND preserve queue state so 'Z' is still peeked and remaining!
    const stream = [
      0.999, 0.999, 0.999, 0.999, 0.999, 0.999, // Bag 1: ['I', 'O', 'T', 'J', 'L', 'S', 'Z']
      0.2, 0.3, 0.4, 1.0, // Refill attempt fails on 4th sample
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // Subsequent valid refill: ['O', 'T', 'J', 'L', 'S', 'Z', 'I']
    ];
    let pos = 0;
    const queue = createSevenBagQueue(() => stream[pos++]!);

    for (let i = 0; i < 6; i += 1) {
      queue.drawNext();
    }
    expect(queue.peekNext()).toBe('Z');
    expect(queue.getRemainingInBag()).toEqual(['Z']);

    // 7th draw triggers refill, which fails at stream[9] === 1.0
    expect(() => queue.drawNext()).toThrow(RangeError);

    // State must be completely unmutated: 'Z' is still the next piece!
    expect(queue.peekNext()).toBe('Z');
    expect(queue.getRemainingInBag()).toEqual(['Z']);

    // Retrying drawNext() now consumes the remaining valid samples and succeeds
    expect(queue.drawNext()).toBe('Z');
    expect(queue.peekNext()).toBe('O');
  });
});
