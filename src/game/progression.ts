import type { GameConfig } from '../contracts/config';
import type { Progression } from '../contracts/types';

/** The progression a game starts with: the chosen menu level, nothing fallen, ordinary batches. */
export function initialProgression(level: number, config: GameConfig): Progression {
    return { fallenCount: 0, level, pendingBatchSize: config.batchSize, rampCounter: 0 };
}

/**
 * Counts landed objects (spec §12.1): every time the cumulative count crosses a multiple of the
 * configured level-up interval, the level rises, the ramp dips back to zero and the next batch is
 * the larger level-up batch. The count itself never resets, so the 41st object does not retrigger.
 */
export function registerFallen(progression: Progression, landedCount: number, config: GameConfig): Progression {
    const fallenCount = progression.fallenCount + landedCount;
    const before = Math.floor(progression.fallenCount / config.levelUpEvery);
    const after = Math.floor(fallenCount / config.levelUpEvery);
    if (after <= before) {
        return { ...progression, fallenCount };
    }
    return { fallenCount, level: progression.level + 1, pendingBatchSize: config.levelUpBatchSize, rampCounter: 0 };
}

/** Advances the speed ramp one step per tick, capped at the configured maximum (spec §12.1). */
export function advanceRamp(progression: Progression, config: GameConfig): Progression {
    return { ...progression, rampCounter: Math.min(progression.rampCounter + 1, config.rampCounterMax) };
}

/** Resets the next-batch size to the ordinary batch once a batch has spawned (spec §12.1). */
export function batchSpawned(progression: Progression, config: GameConfig): Progression {
    return { ...progression, pendingBatchSize: config.batchSize };
}
