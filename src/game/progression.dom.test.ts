import { advanceRamp, batchSpawned, initialProgression, registerFallen } from './progression';
import { describe, expect, it } from 'vite-plus/test';

import { GAME_CONFIG } from '../contracts/config';
import type { Progression } from '../contracts/types';
import { fallIntervalTicks } from './gravity';

const atLevel = (level: number): Progression => initialProgression(level, GAME_CONFIG);

describe('registerFallen (spec §12.1)', () => {
    it('T17: the 40th fallen object levels up, dips the ramp and arms the 3-object batch', () => {
        // Arrange: 39 objects have landed; the ramp has been climbing
        const before: Progression = { ...atLevel(1), fallenCount: 39, rampCounter: 7 };

        // Act
        const after = registerFallen(before, 1, GAME_CONFIG);

        // Assert
        expect(after).toEqual({ fallenCount: 40, level: 2, pendingBatchSize: 3, rampCounter: 0 });
    });

    it('returns to the ordinary batch size once the level-up batch has spawned', () => {
        // Arrange
        const armed: Progression = { fallenCount: 40, level: 2, pendingBatchSize: 3, rampCounter: 0 };

        // Act
        const after = batchSpawned(armed, GAME_CONFIG);

        // Assert
        expect(after.pendingBatchSize).toBe(GAME_CONFIG.batchSize);
    });

    it('keeps the cumulative count across level-ups — the 41st object does not retrigger', () => {
        // Arrange
        const levelled = registerFallen({ ...atLevel(1), fallenCount: 39 }, 1, GAME_CONFIG);

        // Act
        const after = registerFallen(levelled, 1, GAME_CONFIG);

        // Assert
        expect(after.level).toBe(2);
        expect(after.fallenCount).toBe(41);
        expect(after.pendingBatchSize).toBe(3);
    });
});

describe('advanceRamp (spec §12.1)', () => {
    it('increments the ramp each tick up to the configured maximum', () => {
        // Arrange
        const capped = { ...atLevel(1), rampCounter: GAME_CONFIG.rampCounterMax };

        // Act / Assert
        expect(advanceRamp(atLevel(1), GAME_CONFIG).rampCounter).toBe(1);
        expect(advanceRamp(capped, GAME_CONFIG).rampCounter).toBe(GAME_CONFIG.rampCounterMax);
    });

    it('shortens the fall interval as the ramp climbs', () => {
        // Arrange
        const calm = { level: 1, rampCounter: 0, softDrop: false, speedMode: 'low' } as const;
        const ramped = { ...calm, rampCounter: 5 };

        // Act / Assert
        expect(fallIntervalTicks(ramped, GAME_CONFIG)).toBeLessThan(fallIntervalTicks(calm, GAME_CONFIG));
    });
});
