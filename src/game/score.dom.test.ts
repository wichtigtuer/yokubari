import { INITIAL_SCORE, applyTickEvents } from './score';
import { describe, expect, it } from 'vite-plus/test';

import { GAME_CONFIG } from '../contracts/config';
import type { TickEvent } from './tick';

const [, TIER_TWO] = GAME_CONFIG.hatchTiers;

describe('applyTickEvents (spec §11)', () => {
    it('adds scored and hatched points and counts the hatch', () => {
        // Arrange
        const events: TickEvent[] = [
            { points: 5, type: 'scored' },
            { enclosed: 3, points: 100, tier: TIER_TWO, type: 'hatched' }
        ];

        // Act
        const result = applyTickEvents(INITIAL_SCORE, events);

        // Assert
        expect(result).toEqual({ hatched: 1, score: 105 });
    });

    it('adds nothing for ticks without score events — a vanished cap scores 0', () => {
        // Arrange
        const events: TickEvent[] = [{ type: 'game-over' }];

        // Act
        const result = applyTickEvents({ hatched: 2, score: 40 }, events);

        // Assert
        expect(result).toEqual({ hatched: 2, score: 40 });
    });

    it('accumulates across ticks without multipliers', () => {
        // Arrange
        const first = applyTickEvents(INITIAL_SCORE, [{ points: 5, type: 'scored' }]);

        // Act
        const second = applyTickEvents(first, [{ points: 5, type: 'scored' }]);

        // Assert
        expect(second.score).toBe(10);
    });
});
