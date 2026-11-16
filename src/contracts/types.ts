import type { Brand } from '../utils/brand';

/** The four monster kinds that can appear in stacks and in the falling supply. */
export type Monster = 'm0' | 'm1' | 'm2' | 'm3';

/** Anything that can rest inside a tray stack: a monster or the bottom half of an egg. */
export type StackItem = Monster | 'base';

/** Anything that can fall: a monster, an egg bottom half, or an egg top half (cap). */
export type Falling = Monster | 'base' | 'cap';

/** Index of one of the four board columns. */
export type ColumnIndex = 0 | 1 | 2 | 3;

/** Index of an adjacent column pair the cursor can straddle. */
export type CursorPair = 0 | 1 | 2;

/** Game speed selected on the menu; drives the fall-interval table. */
export type SpeedMode = 'low' | 'high';

/** Nominal identity of a falling object, stable across ticks. */
export type ObjectId = Brand<number, 'ObjectId'>;

/** Brands a number as an {@link ObjectId}; the single place the brand is asserted. */
export function toObjectId(value: number): ObjectId {
    // Justified assertion: the brand is compile-time-only, and this constructor is its sole source
    return value as ObjectId;
}

/** An object currently falling: its kind, the column it occupies and its vertical position. */
export type FallingObject = Readonly<{ id: ObjectId; kind: Falling; column: ColumnIndex; y: number }>;

/** The screens and play states the application can be in. */
export type Phase =
    | 'title'
    | 'menu'
    | 'ready'
    | 'playing'
    | 'paused'
    | 'stage-clear'
    | 'game-over'
    | 'round-result'
    | 'match-result';

/** A spawned object waiting out its staggered entry delay above the board (spec §4). */
export type PendingObject = Readonly<{ column: ColumnIndex; kind: Falling; remainingTicks: number }>;

/** The board: four tray stacks plus everything falling above them and the tick-scheduling state. */
export type BoardState = Readonly<{
    columns: readonly (readonly StackItem[])[];
    fallAccumulator: number;
    falling: readonly FallingObject[];
    nextObjectId: number;
    pending: readonly PendingObject[];
}>;

/** Level progression counters; they evolve together and travel as one immutable unit. */
export type Progression = Readonly<{
    level: number;
    fallenCount: number;
    rampCounter: number;
    pendingBatchSize: number;
}>;

/** The complete deterministic state of one player's game. */
export type GameState = Readonly<{
    phase: Phase;
    board: BoardState;
    score: number;
    hatched: number;
    progression: Progression;
}>;
