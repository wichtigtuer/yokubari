import { createRng, nextInt } from './random';
import { describe, expect, it } from 'vite-plus/test';

const SEQUENCE_LENGTH = 100;
const DRAWS_PER_BOUND_CHECK = 1000;
const BOUND_COUNT = 4;

const drawSequence = (seed: number, length: number): number[] => {
    const rng = createRng(seed);
    return Array.from({ length }, () => rng());
};

describe('createRng', () => {
    it('produces identical sequences for two generators with the same seed', () => {
        // Arrange / act
        const first = drawSequence(42, SEQUENCE_LENGTH);
        const second = drawSequence(42, SEQUENCE_LENGTH);

        // Assert
        expect(second).toEqual(first);
    });

    it('produces different sequences for different seeds', () => {
        // Arrange / act
        const first = drawSequence(42, SEQUENCE_LENGTH);
        const other = drawSequence(43, SEQUENCE_LENGTH);

        // Assert
        expect(other).not.toEqual(first);
    });

    it('accepts seed 0 and yields values in [0, 1)', () => {
        // Arrange / act
        const sequence = drawSequence(0, SEQUENCE_LENGTH);

        // Assert
        expect(sequence.every((value) => value >= 0 && value < 1)).toBe(true);
        expect(new Set(sequence).size).toBe(SEQUENCE_LENGTH);
    });
});

describe('nextInt', () => {
    it('only yields integers within 0..count-1', () => {
        // Arrange
        const rng = createRng(7);
        const draws = Array.from({ length: DRAWS_PER_BOUND_CHECK }, () => nextInt(rng, BOUND_COUNT));

        // Act / Assert
        expect(draws.every((draw) => Number.isInteger(draw))).toBe(true);
        expect(Math.min(...draws)).toBeGreaterThanOrEqual(0);
        expect(Math.max(...draws)).toBeLessThan(BOUND_COUNT);
    });
});
