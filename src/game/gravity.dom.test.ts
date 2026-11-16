import { describe, expect, it } from 'vite-plus/test';

import { fallIntervalTicks, hasLanded, stepFalling } from './gravity';
import type { FallContext } from './gravity';
import { GAME_CONFIG } from '../contracts/config';
import { toObjectId } from '../contracts/types';

const context = (speedMode: 'low' | 'high', level: number, softDrop: boolean): FallContext => ({
    batchSize: GAME_CONFIG.batchSize,
    level,
    rampCounter: 0,
    softDrop,
    speedMode
});

describe('fallIntervalTicks (spec §7)', () => {
    it('equals the config table value for the mode and level without soft drop', () => {
        // Arrange / act
        const lowOne = fallIntervalTicks(context('low', 1, false), GAME_CONFIG);
        const highThree = fallIntervalTicks(context('high', 3, false), GAME_CONFIG);

        // Assert
        expect(lowOne).toBe(GAME_CONFIG.fallIntervals.low[0]);
        expect(highThree).toBe(GAME_CONFIG.fallIntervals.high[2]);
    });

    it('is faster on HIGH than on LOW at the same level', () => {
        // Arrange / act
        const low = fallIntervalTicks(context('low', 2, false), GAME_CONFIG);
        const high = fallIntervalTicks(context('high', 2, false), GAME_CONFIG);

        // Assert
        expect(high).toBeLessThan(low);
    });

    it('T15: soft drop shortens the interval but never below the minimum', () => {
        // Arrange / act
        const normal = fallIntervalTicks(context('high', 5, false), GAME_CONFIG);
        const dropped = fallIntervalTicks(context('high', 5, true), GAME_CONFIG);
        const extreme = fallIntervalTicks({ ...context('high', 5, true), rampCounter: 100 }, GAME_CONFIG);

        // Assert
        expect(dropped).toBeLessThan(normal);
        expect(dropped).toBeGreaterThanOrEqual(GAME_CONFIG.minFallInterval);
        expect(extreme).toBe(GAME_CONFIG.minFallInterval);
    });

    it('clamps levels beyond the table to the fastest entry', () => {
        // Arrange / act
        const beyond = fallIntervalTicks(context('low', 99, false), GAME_CONFIG);

        // Assert
        expect(beyond).toBe(GAME_CONFIG.fallIntervals.low[GAME_CONFIG.fallIntervals.low.length - 1]);
    });
});

describe('stepFalling and hasLanded (spec §7)', () => {
    it('advances exactly 1/stepsPerCell per step', () => {
        // Arrange
        const object = { column: 0, id: toObjectId(1), kind: 'm0', y: 7 } as const;

        // Act
        const stepped = stepFalling(object, GAME_CONFIG);

        // Assert
        expect(stepped.y).toBeCloseTo(7 - 1 / GAME_CONFIG.stepsPerCell, 10);
    });

    it('detects landing exactly when the altitude reaches the column height', () => {
        // Arrange
        const object = { column: 1, id: toObjectId(2), kind: 'm1', y: 3 } as const;
        const above = { ...object, y: 3.25 };

        // Act / Assert
        expect(hasLanded(object, 3)).toBe(true);
        expect(hasLanded(above, 3)).toBe(false);
        expect(hasLanded(stepFalling(above, GAME_CONFIG), 3)).toBe(true);
    });
});
