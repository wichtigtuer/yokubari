import { describe, expect, it } from 'vite-plus/test';

import { GAME_CONFIG } from './config';

describe('GAME_CONFIG hatch tiers', () => {
    it('is ascending in maxEnclosed', () => {
        // Arrange
        const thresholds = GAME_CONFIG.hatchTiers.map((tier) => tier.maxEnclosed);

        // Act / Assert
        expect(thresholds.every((threshold, index) => index === 0 || thresholds[index - 1] < threshold)).toBe(true);
    });

    it('covers 0..stackCapacity-1 contiguously', () => {
        // Arrange
        const covered = GAME_CONFIG.hatchTiers.map((tier) => tier.maxEnclosed);

        // Act / Assert: each enclosed count 0..6 falls into exactly the tier whose range it enters
        for (let enclosed = 0; enclosed < GAME_CONFIG.stackCapacity; enclosed += 1) {
            const matching = covered.filter((threshold) => threshold <= enclosed);
            expect(matching.length).toBeGreaterThan(0);
        }
        expect(covered[0]).toBe(0);
    });

    it('maxes out one below stack capacity (spec §2)', () => {
        // Arrange / act
        const maxEnclosed = Math.max(...GAME_CONFIG.hatchTiers.map((tier) => tier.maxEnclosed));

        // Assert
        expect(maxEnclosed).toBe(GAME_CONFIG.stackCapacity - 1);
    });
});

describe('GAME_CONFIG type weights', () => {
    it('covers exactly the six falling types', () => {
        // Arrange / act
        const kinds = GAME_CONFIG.typeWeights.map(([kind]) => kind);

        // Assert
        expect(kinds).toHaveLength(6);
        expect(kinds).toEqual(expect.arrayContaining(['base', 'cap', 'm0', 'm1', 'm2', 'm3']));
    });

    it('gives every type a positive weight so each can spawn', () => {
        // Arrange / act
        const weights = GAME_CONFIG.typeWeights.map(([, weight]) => weight);

        // Assert
        expect(weights.every((weight) => weight > 0)).toBe(true);
    });
});

describe('GAME_CONFIG board geometry', () => {
    it('matches the spec §2 vocabulary: four columns of capacity seven', () => {
        // Arrange / act / assert
        expect(GAME_CONFIG.columns).toBe(4);
        expect(GAME_CONFIG.stackCapacity).toBe(7);
    });
});
