import { createRng, nextInt, weightedChoice } from './random';
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

describe('weightedChoice', () => {
    it('never picks an entry with zero weight', () => {
        // Arrange
        const rng = createRng(11);
        const entries = [
            ['m0', 1],
            ['m1', 0]
        ] as const;

        // Act
        const picks = Array.from({ length: DRAWS_PER_BOUND_CHECK }, () => weightedChoice(rng, entries));

        // Assert
        expect(picks.every((pick) => pick.type === 'ok' && pick.value === 'm0')).toBe(true);
    });

    it('rejects an empty entry list', () => {
        // Arrange / act
        const outcome = weightedChoice(createRng(1), []);

        // Assert
        expect(outcome).toEqual({ error: { reason: 'empty' }, type: 'error' });
    });

    it('rejects entries whose weights are all non-positive', () => {
        // Arrange / act
        const outcome = weightedChoice(createRng(1), [['m0', 0]]);

        // Assert
        expect(outcome).toEqual({ error: { reason: 'no-positive-weight' }, type: 'error' });
    });

    it('favours heavier weights across many draws', () => {
        // Arrange
        const rng = createRng(99);
        const entries = [
            ['heavy', 9],
            ['light', 1]
        ] as const;

        // Act
        const picks = Array.from({ length: DRAWS_PER_BOUND_CHECK }, () => weightedChoice(rng, entries));
        const heavyCount = picks.filter((pick) => pick.type === 'ok' && pick.value === 'heavy').length;

        // Assert: 90% expected; a generous lower bound keeps the test deterministic-safe
        expect(heavyCount).toBeGreaterThan(DRAWS_PER_BOUND_CHECK / 2);
    });
});
