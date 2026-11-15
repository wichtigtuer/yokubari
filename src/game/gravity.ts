import type { FallingObject, SpeedMode } from '../contracts/types';
import type { GameConfig } from '../contracts/config';

/** Everything that determines how fast objects fall right now (spec §7). */
export type FallContext = Readonly<{
    level: number;
    rampCounter: number;
    softDrop: boolean;
    speedMode: SpeedMode;
}>;

const MIN_LEVEL = 1;

/**
 * Ticks between two fall steps (spec §7): the configured interval for the speed mode and level,
 * shortened by the ramp counter and divided while soft drop is held — never below the minimum,
 * so objects always advance step by step and never teleport (T15).
 */
export function fallIntervalTicks(context: FallContext, config: GameConfig): number {
    const table = config.fallIntervals[context.speedMode];
    const levelIndex = Math.min(Math.max(context.level, MIN_LEVEL), table.length) - 1;
    const ramped = Math.max(config.minFallInterval, table[levelIndex] - context.rampCounter * config.rampIntervalStep);
    if (!context.softDrop) {
        return ramped;
    }
    return Math.max(config.minFallInterval, Math.floor(ramped / config.softDropMultiplier));
}

/** Advances a falling object one step down; stepsPerCell steps cross one stack cell. */
export function stepFalling(object: FallingObject, config: GameConfig): FallingObject {
    return { ...object, y: object.y - 1 / config.stepsPerCell };
}

/** True once an object's altitude reaches the current height of its column. */
export function hasLanded(object: FallingObject, columnHeight: number): boolean {
    return object.y <= columnHeight;
}
