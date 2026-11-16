import type { BoardState, FallingObject, PendingObject, StackItem } from '../contracts/types';
import type { GameConfig, HatchTier } from '../contracts/config';
import { fallIntervalTicks, hasLanded, stepFalling } from './gravity';
import type { Batch } from './spawn';
import type { FallContext } from './gravity';
import type { LandingOutcome } from './resolve';
import type { Rng } from '../utils/random';
import { generateBatch } from './spawn';
import { heightOf } from './board';
import { landObject } from './overflow';
import { toObjectId } from '../contracts/types';

/** What one board tick produced, in the order it happened (spec §14). */
export type TickEvent =
    | Readonly<{ type: 'batch-spawned'; batch: Batch }>
    | Readonly<{ type: 'game-over' }>
    | Readonly<{ type: 'hatched'; enclosed: number; tier: HatchTier; points: number }>
    | Readonly<{ type: 'scored'; points: number }>;

/** The board after one tick, the events it emitted and how many objects landed. */
export type TickResult = Readonly<{ board: BoardState; events: readonly TickEvent[]; landedCount: number }>;

type SpawnStage = Readonly<{ board: BoardState; events: readonly TickEvent[] }>;
type ResolutionStage = Readonly<{ board: BoardState; events: readonly TickEvent[]; landedCount: number }>;

const spawnHeight = (config: GameConfig): number => config.stackCapacity + 1;

/** Moves a spawned batch onto the board: delay-free objects enter at once, the rest wait pending. */
function enqueueBatch(board: BoardState, batch: Batch, config: GameConfig): BoardState {
    let nextId = board.nextObjectId;
    const entering: FallingObject[] = [];
    const waiting: PendingObject[] = [];
    for (const object of batch.objects) {
        if (object.spawnDelay === 0) {
            entering.push({ column: object.column, id: toObjectId(nextId), kind: object.kind, y: spawnHeight(config) });
            nextId += 1;
        } else {
            waiting.push({ column: object.column, kind: object.kind, remainingTicks: object.spawnDelay });
        }
    }
    return {
        ...board,
        falling: [...board.falling, ...entering],
        nextObjectId: nextId,
        pending: [...board.pending, ...waiting]
    };
}

/** Spawns the next batch when the field holds nothing falling or pending (spec §14 step 10). */
function maybeSpawn(board: BoardState, context: FallContext, rng: Rng, config: GameConfig): SpawnStage {
    if (board.falling.length > 0 || board.pending.length > 0) {
        return { board, events: [] };
    }
    const batch = generateBatch(rng, config, context.batchSize);
    if (batch.type === 'error') {
        // Unreachable for a config that passes the invariant tests; the game cannot continue
        return { board, events: [{ type: 'game-over' }] };
    }
    return { board: enqueueBatch(board, batch.value, config), events: [{ batch: batch.value, type: 'batch-spawned' }] };
}

/** Counts down pending entries and moves due objects into the field with fresh ids. */
function enterPending(board: BoardState, config: GameConfig): BoardState {
    let nextId = board.nextObjectId;
    const staying: PendingObject[] = [];
    const entering: FallingObject[] = [];
    for (const pending of board.pending) {
        if (pending.remainingTicks <= 1) {
            entering.push({
                column: pending.column,
                id: toObjectId(nextId),
                kind: pending.kind,
                y: spawnHeight(config)
            });
            nextId += 1;
        } else {
            staying.push({ ...pending, remainingTicks: pending.remainingTicks - 1 });
        }
    }
    return { ...board, falling: [...board.falling, ...entering], nextObjectId: nextId, pending: staying };
}

/** Advances every falling object one step once the fall interval elapses (spec §7). */
function advanceFall(board: BoardState, context: FallContext, config: GameConfig): BoardState {
    const accumulator = board.fallAccumulator + 1;
    if (accumulator < fallIntervalTicks(context, config)) {
        return { ...board, fallAccumulator: accumulator };
    }
    return { ...board, fallAccumulator: 0, falling: board.falling.map((object) => stepFalling(object, config)) };
}

/** Updates a column from a landing outcome; a vanishing cap leaves it untouched. */
function applyOutcome(column: readonly StackItem[], outcome: LandingOutcome): readonly StackItem[] {
    if (outcome.type === 'cap-vanished') {
        return column;
    }
    return outcome.column;
}

/** Returns the columns array with one column replaced. */
function replaceColumn(
    columns: readonly (readonly StackItem[])[],
    target: number,
    next: readonly StackItem[]
): readonly (readonly StackItem[])[] {
    return columns.map((column, index) => {
        if (index === target) {
            return next;
        }
        return column;
    });
}

/** Events for a resolved landing: scores and hatches are observable, plain stacking is not. */
function outcomeEvents(outcome: LandingOutcome, gameOver: boolean): TickEvent[] {
    const events: TickEvent[] = [];
    if (outcome.type === 'pair-cleared') {
        events.push({ points: outcome.points, type: 'scored' });
    }
    if (outcome.type === 'hatched') {
        events.push({ enclosed: outcome.enclosed, points: outcome.points, tier: outcome.tier, type: 'hatched' });
    }
    if (gameOver) {
        events.push({ type: 'game-over' });
    }
    return events;
}

/** True once a game-over event has been emitted this tick. */
function hasGameOver(events: readonly TickEvent[]): boolean {
    return events.some((event) => event.type === 'game-over');
}

/** Resolves one falling object against the stage so far: land it, or carry it over unresolved. */
function resolveOne(stage: ResolutionStage, object: FallingObject, config: GameConfig): ResolutionStage {
    const column = stage.board.columns[object.column];
    if (hasGameOver(stage.events) || !hasLanded(object, heightOf(column))) {
        return { ...stage, board: { ...stage.board, falling: [...stage.board.falling, object] } };
    }
    const landed = landObject(column, object.kind, config);
    return {
        board: {
            ...stage.board,
            columns: replaceColumn(stage.board.columns, object.column, applyOutcome(column, landed.outcome))
        },
        events: [...stage.events, ...outcomeEvents(landed.outcome, landed.gameOver)],
        landedCount: stage.landedCount + 1
    };
}

/** Resolves each landing immediately on contact, in falling order; game over ends the tick. */
function resolveLandings(board: BoardState, config: GameConfig): ResolutionStage {
    let stage: ResolutionStage = { board: { ...board, falling: [] }, events: [], landedCount: 0 };
    for (const object of board.falling) {
        stage = resolveOne(stage, object, config);
    }
    return stage;
}

/** One board tick in spec §14 order: spawn when empty, enter due objects, advance, resolve. */
export function tickBoard(board: BoardState, context: FallContext, rng: Rng, config: GameConfig): TickResult {
    const spawned = maybeSpawn(board, context, rng, config);
    const entered = enterPending(spawned.board, config);
    const stepped = advanceFall(entered, context, config);
    const resolved = resolveLandings(stepped, config);
    return {
        board: resolved.board,
        events: [...spawned.events, ...resolved.events],
        landedCount: resolved.landedCount
    };
}
