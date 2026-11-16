import type { BoardState, ColumnIndex, Monster, PendingObject, Progression, SpeedMode } from '../contracts/types';
import { INITIAL_SCORE, applyTickEvents } from './score';
import type { TickEvent, TickResult } from './tick';
import { advanceRamp, batchSpawned, initialProgression, registerFallen } from './progression';
import type { FallContext } from './gravity';
import type { GameConfig } from '../contracts/config';
import type { Rng } from '../utils/random';
import type { ScoreState } from './score';
import { createEmptyBoard } from './board';
import { nextInt } from '../utils/random';
import { tickBoard } from './tick';

/** One of the two competing sides. */
export type Side = 'left' | 'right';

/** What a side's player is doing this tick. */
export type SideInput = Readonly<{ softDrop: boolean; speedMode: SpeedMode }>;

/** One side of the match: its board, progression, score and the attacks queued against it. */
export type SideState = Readonly<{
    board: BoardState;
    pendingAttack: readonly PendingObject[];
    progression: Progression;
    score: ScoreState;
}>;

/** The full lock-step versus state: two isolated sides plus the match score. */
export type VersusState = Readonly<{
    left: SideState;
    right: SideState;
    round: number;
    tokens: Readonly<{ left: number; right: number }>;
}>;

/** What a versus tick can report, in adjudication order. */
export type VersusEvent =
    | Readonly<{ type: 'attack-sent'; count: number; from: Side }>
    | Readonly<{ type: 'round-decided'; outcome: RoundOutcome }>
    | Readonly<{ type: 'match-decided'; winner: Side }>;

/** How a round ended (spec §12.3); a double overflow restarts, a double clear rewards both. */
export type RoundOutcome =
    | Readonly<{ type: 'cleared'; side: Side }>
    | Readonly<{ type: 'overflow'; side: Side }>
    | Readonly<{ type: 'both-cleared' }>
    | Readonly<{ type: 'draw-overflow' }>;

const MONSTER_KINDS: readonly Monster[] = ['m0', 'm1', 'm2', 'm3'];
const SIDE_COLUMNS: readonly ColumnIndex[] = [0, 1, 2, 3];
const NO_ATTACK = 0;

/** A side at round start: empty board, fresh progression and score, no queued attacks. */
function freshSide(config: GameConfig): SideState {
    return {
        board: createEmptyBoard(),
        pendingAttack: [],
        progression: initialProgression(1, config),
        score: INITIAL_SCORE
    };
}

/** A new match: two fresh sides, no tokens, round one. */
export function createVersus(config: GameConfig): VersusState {
    return { left: freshSide(config), right: freshSide(config), round: 1, tokens: { left: 0, right: 0 } };
}

/** Re-initializes both boards for the next round; tokens persist across rounds (spec §12.3). */
export function startRound(state: VersusState, config: GameConfig): VersusState {
    return { ...state, left: freshSide(config), right: freshSide(config), round: state.round + 1 };
}

/** Builds one attack object per enclosed monster, kinds and columns fixed now from the receiver's stream. */
function composeAttack(rng: Rng, count: number, config: GameConfig): PendingObject[] {
    const attack: PendingObject[] = [];
    for (let index = 0; index < count; index += 1) {
        attack.push({
            column: SIDE_COLUMNS[nextInt(rng, config.columns)],
            kind: MONSTER_KINDS[nextInt(rng, MONSTER_KINDS.length)],
            remainingTicks: 0
        });
    }
    return attack;
}

/** Every attack a tick's hatch events send, in hatch order; a dry hatch (N = 0) sends nothing. */
function attacksFrom(
    events: readonly TickEvent[],
    from: Side,
    rng: Rng,
    config: GameConfig
): Readonly<{ objects: PendingObject[]; sent: VersusEvent[] }> {
    const objects: PendingObject[] = [];
    const sent: VersusEvent[] = [];
    for (const event of events) {
        if (event.type === 'hatched' && event.enclosed > NO_ATTACK) {
            objects.push(...composeAttack(rng, event.enclosed, config));
            sent.push({ count: event.enclosed, from, type: 'attack-sent' });
        }
    }
    return { objects, sent };
}

/** Moves a queued attack onto the board through the ordinary pending/stagger path once the field is empty. */
function drainAttack(side: SideState, config: GameConfig): SideState {
    const fieldEmpty = side.board.falling.length === 0 && side.board.pending.length === 0;
    if (!fieldEmpty || side.pendingAttack.length === 0) {
        return side;
    }
    const staggered = side.pendingAttack.map((attack, index) => ({
        ...attack,
        remainingTicks: 1 + index * config.spawnStaggerTicks
    }));
    return { ...side, board: { ...side.board, pending: [...side.board.pending, ...staggered] }, pendingAttack: [] };
}

/** The fall context one side's board ticks with: input flags plus what its progression armed. */
function contextFor(side: SideState, input: SideInput): FallContext {
    return {
        batchSize: side.progression.pendingBatchSize,
        level: side.progression.level,
        rampCounter: side.progression.rampCounter,
        softDrop: input.softDrop,
        speedMode: input.speedMode
    };
}

/** Advances one side's board, score and progression from what its tick produced. */
function settleSide(side: SideState, result: TickResult, config: GameConfig): SideState {
    const counted = registerFallen(side.progression, result.landedCount, config);
    const ramped = advanceRamp(counted, config);
    const spawned = result.events.some((event) => event.type === 'batch-spawned');
    if (spawned) {
        return {
            ...side,
            board: result.board,
            progression: batchSpawned(ramped, config),
            score: applyTickEvents(side.score, result.events)
        };
    }
    return { ...side, board: result.board, progression: ramped, score: applyTickEvents(side.score, result.events) };
}

/** Ticks one side: drain its queued attack first, then run the ordinary board tick (spec §14). */
function tickSide(
    side: SideState,
    input: SideInput,
    rng: Rng,
    config: GameConfig
): Readonly<{ side: SideState; result: TickResult }> {
    const drained = drainAttack(side, config);
    const result = tickBoard(drained.board, contextFor(drained, input), rng, config);
    return { result, side: settleSide(drained, result, config) };
}

/**
 * Advances both boards by one lock-step tick (spec §12.3): each side ticks with its own RNG, then
 * hatch events compose attacks against the opponent — kinds and columns drawn from the receiving
 * side's stream, so replaying one side reproduces its field exactly. Round adjudication follows.
 */
export function tickVersus(
    state: VersusState,
    inputs: Readonly<Record<Side, SideInput>>,
    rngs: Readonly<Record<Side, Rng>>,
    config: GameConfig
): Readonly<{ events: readonly VersusEvent[]; state: VersusState }> {
    const left = tickSide(state.left, inputs.left, rngs.left, config);
    const right = tickSide(state.right, inputs.right, rngs.right, config);
    const toRight = attacksFrom(left.result.events, 'left', rngs.right, config);
    const toLeft = attacksFrom(right.result.events, 'right', rngs.left, config);
    const leftSide: SideState = { ...left.side, pendingAttack: [...left.side.pendingAttack, ...toLeft.objects] };
    const rightSide: SideState = { ...right.side, pendingAttack: [...right.side.pendingAttack, ...toRight.objects] };
    return {
        events: [...toRight.sent, ...toLeft.sent],
        state: { ...state, left: leftSide, right: rightSide }
    };
}
