import { describe, expect, it } from 'vite-plus/test';

import { findTopmostBaseIndex, hatchTierFor } from './egg';
import { GAME_CONFIG } from '../contracts/config';

describe('hatchTierFor', () => {
    it('maps the tier boundaries 0, 1-3, 4-5 and 6 to tiers 1-4 (spec §9)', () => {
        // Arrange
        const expectations = [
            { enclosed: 0, points: 50, tier: 1 },
            { enclosed: 1, points: 100, tier: 2 },
            { enclosed: 3, points: 100, tier: 2 },
            { enclosed: 4, points: 200, tier: 3 },
            { enclosed: 5, points: 200, tier: 3 },
            { enclosed: 6, points: 500, tier: 4 }
        ];

        // Act / Assert
        for (const { enclosed, points, tier } of expectations) {
            const outcome = hatchTierFor(enclosed, GAME_CONFIG);
            expect(outcome.type).toBe('ok');
            if (outcome.type === 'ok') {
                expect(outcome.value.points).toBe(points);
                expect(outcome.value.tier).toBe(tier);
            }
        }
    });

    it('rejects enclosed counts outside 0..stackCapacity-1', () => {
        // Arrange / act
        const tooLow = hatchTierFor(-1, GAME_CONFIG);
        const tooHigh = hatchTierFor(7, GAME_CONFIG);

        // Assert
        expect(tooLow).toEqual({ error: { enclosed: -1, reason: 'enclosed-out-of-range' }, type: 'error' });
        expect(tooHigh).toEqual({ error: { enclosed: 7, reason: 'enclosed-out-of-range' }, type: 'error' });
    });
});

describe('findTopmostBaseIndex', () => {
    it('returns none when no base half rests in the column', () => {
        // Arrange / act / assert
        expect(findTopmostBaseIndex([])).toEqual({ type: 'none' });
        expect(findTopmostBaseIndex(['m0', 'm1'])).toEqual({ type: 'none' });
    });

    it('binds the topmost base half when several exist (spec §9 [M])', () => {
        // Arrange / act
        const index = findTopmostBaseIndex(['base', 'm0', 'base', 'm1']);

        // Assert
        expect(index).toEqual({ type: 'some', value: 2 });
    });
});
