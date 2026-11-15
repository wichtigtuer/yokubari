import type { Falling, SpeedMode } from './types';

/** Score tier awarded when an egg hatches, selected by how many monsters the egg enclosed. */
export type HatchTier = Readonly<{ maxEnclosed: number; points: number; tier: number }>;

/** Every tunable of the mechanics specification (spec §17) as typed, compile-time-checked data. */
export type GameConfig = Readonly<{
    /** Stack count below which the supply adapts to the exposed stack tops. [U] */
    adaptThreshold: number;
    /** Points for landing a base half on a matching base half (spec §8). */
    basePairScore: number;
    /** Objects per ordinary spawn batch (spec §4). */
    batchSize: number;
    /** Whether the post-game bonus round is offered. [U] */
    bonusEnabled: boolean;
    /** Multiplier applied to bonus-round rewards. [U] */
    bonusPointMultiplier: number;
    /** Points for a cap landing where no base half binds (spec §9). */
    capNoBaseScore: number;
    /** Number of board columns (spec §2). */
    columns: number;
    /** Base ticks between fall steps, per speed mode and level (index = level - 1). [U] */
    fallIntervals: Readonly<Record<SpeedMode, readonly number[]>>;
    /** Hatch score tiers, ascending in maxEnclosed and covering 0..stackCapacity-1 (spec §9). */
    hatchTiers: readonly HatchTier[];
    /** Objects per spawn batch right after a level-up (spec §11). */
    levelUpBatchSize: number;
    /** Fallen objects per level in endless mode (spec §11). */
    levelUpEvery: number;
    /** Selectable level range on the menu: [min, max]. */
    menuLevels: readonly [number, number];
    /** Lower clamp for any computed fall interval, in ticks (spec §7). */
    minFallInterval: number;
    /** Points for landing a monster on a matching monster (spec §8). */
    monsterPairScore: number;
    /** Number of selectable music tracks on the menu. */
    musicTrackCount: number;
    /** Monster pairs stacked per column by stage prefill. [U] */
    prefillPairsPerColumn: number;
    /** Ticks shaved off the base interval per ramp-counter step (spec §11). [U] */
    rampIntervalStep: number;
    /** Divisor applied to the fall interval while soft drop is held (spec §7). [U] */
    softDropMultiplier: number;
    /** Ticks between the entry of consecutive objects of one batch (spec §4). [U] */
    spawnStaggerTicks: number;
    /** Maximum stack height before overflow (spec §2). */
    stackCapacity: number;
    /** Stage-clear bonus per stage number (index = stage - 1); lookups clamp at the last row. [U] */
    stageBonuses: readonly number[];
    /** Fall steps needed to cross one stack cell (spec §7). [U] */
    stepsPerCell: number;
    /** Carry rule for falling objects during a tray swap (spec §6); tunable per spec §17. */
    swapCarryOperator: '>=' | '>';
    /** Spawn distribution over the six falling types (spec §4); uniform by default. [U] */
    typeWeights: readonly (readonly [Falling, number])[];
    /** Round tokens needed to win a versus match (spec §12.3). */
    versusTokensToWin: number;
}>;

/** The single source of gameplay tunables; placeholder [U] values are tuned here, never inline. */
export const GAME_CONFIG = {
    adaptThreshold: 4,
    basePairScore: 5,
    batchSize: 2,
    bonusEnabled: true,
    bonusPointMultiplier: 10,
    capNoBaseScore: 0,
    columns: 4,
    fallIntervals: {
        high: [24, 20, 16, 12, 8],
        low: [48, 42, 36, 30, 24]
    },
    hatchTiers: [
        { maxEnclosed: 0, points: 50, tier: 1 },
        { maxEnclosed: 3, points: 100, tier: 2 },
        { maxEnclosed: 5, points: 200, tier: 3 },
        { maxEnclosed: 6, points: 500, tier: 4 }
    ],
    levelUpBatchSize: 3,
    levelUpEvery: 40,
    menuLevels: [1, 5],
    minFallInterval: 1,
    monsterPairScore: 5,
    musicTrackCount: 3,
    prefillPairsPerColumn: 2,
    rampIntervalStep: 2,
    softDropMultiplier: 4,
    spawnStaggerTicks: 6,
    stackCapacity: 7,
    stageBonuses: [
        50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000, 1050, 1100,
        1150, 1200, 1250, 1300, 1350, 1400, 1450, 1500
    ],
    stepsPerCell: 4,
    swapCarryOperator: '>=',
    typeWeights: [
        ['m0', 1],
        ['m1', 1],
        ['m2', 1],
        ['m3', 1],
        ['base', 1],
        ['cap', 1]
    ],
    versusTokensToWin: 3
} satisfies GameConfig;
