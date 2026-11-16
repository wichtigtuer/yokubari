import type { BoardState, FallingObject, StackItem } from '../contracts/types';
import type { SideInput, VersusEvent, VersusState } from './versus';
import { createVersus, startRound, tickVersus } from './versus';
import { describe, expect, it } from 'vite-plus/test';
import { GAME_CONFIG } from '../contracts/config';
import type { Rng } from '../utils/random';
import { createRng } from '../utils/random';
import { toObjectId } from '../contracts/types';

const withTokens = (state: VersusState): VersusState => ({ ...state, tokens: { left: 2, right: 1 } });

const INPUTS: Readonly<Record<'left' | 'right', SideInput>> = {
    left: { softDrop: false, speedMode: 'low' },
    right: { softDrop: false, speedMode: 'low' }
};

const freshRngs = (): Readonly<Record<'left' | 'right', Rng>> => ({ left: createRng(3), right: createRng(7) });

const boardWith = (columns: readonly (readonly StackItem[])[], falling: readonly FallingObject[]): BoardState => ({
    columns,
    fallAccumulator: 0,
    falling,
    nextObjectId: 100,
    pending: []
});

const versusWith = (left: BoardState, right: BoardState): VersusState => {
    const fresh = createVersus(GAME_CONFIG);
    return { ...fresh, left: { ...fresh.left, board: left }, right: { ...fresh.right, board: right } };
};

const versusWithLeft = (board: BoardState): VersusState => versusWith(board, boardWith([[], [], [], []], []));

/** A falling object about to land: altitude zero always satisfies the landing check. */
const fallingAt = (id: number, kind: FallingObject['kind'], column: FallingObject['column']): FallingObject => ({
    column,
    id: toObjectId(id),
    kind,
    y: 0
});

/** A column at the stack capacity: one more landing overflows it. */
const FULL_COLUMN: readonly StackItem[] = ['m0', 'm1', 'm2', 'm3', 'm0', 'm1', 'm2'];

/** Only the round-decision events of a tick. */
const roundEvents = (events: readonly { type: string }[]): readonly unknown[] =>
    events.filter((event) => event.type === 'round-decided');

/** Plays a match headlessly for the given number of lock-step ticks, collecting every event. */
const runTicks = (ticks: number): { events: VersusEvent[]; state: VersusState } => {
    let state = createVersus(GAME_CONFIG);
    const events: VersusEvent[] = [];
    const rngs = freshRngs();
    for (let tick = 0; tick < ticks; tick += 1) {
        const { events: tickEvents, state: nextState } = tickVersus(state, INPUTS, rngs, GAME_CONFIG);
        state = nextState;
        events.push(...tickEvents);
    }
    return { events, state };
};

/** Only the attack events of a tick; adjudication events are covered by the round tests. */
const attackEvents = (events: readonly { type: string }[]): readonly unknown[] =>
    events.filter((event) => event.type === 'attack-sent');

describe('createVersus (spec §12.3)', () => {
    it('starts at round one with no tokens and two fresh empty sides', () => {
        // Arrange / act
        const state = createVersus(GAME_CONFIG);

        // Assert
        expect(state.round).toBe(1);
        expect(state.tokens).toEqual({ left: 0, right: 0 });
        expect(state.left.board.columns.every((stack) => stack.length === 0)).toBe(true);
        expect(state.right.board.columns.every((stack) => stack.length === 0)).toBe(true);
        expect(state.left.pendingAttack).toEqual([]);
        expect(state.right.pendingAttack).toEqual([]);
    });
});

describe('startRound (spec §12.3)', () => {
    it('re-initializes both boards and increments the round while tokens persist', () => {
        // Arrange: a match mid-flight with tokens on the board
        const state = withTokens(createVersus(GAME_CONFIG));
        const dirtyLeft = state.left.board.columns.map((stack) => [...stack]);
        dirtyLeft[0] = ['base'];
        const dirty: VersusState = {
            ...state,
            left: { ...state.left, board: { ...state.left.board, columns: dirtyLeft } }
        };

        // Act
        const next = startRound(dirty, GAME_CONFIG);

        // Assert
        expect(next.round).toBe(2);
        expect(next.tokens).toEqual({ left: 2, right: 1 });
        expect(next.left.board.columns.every((stack) => stack.length === 0)).toBe(true);
        expect(next.right.board.columns.every((stack) => stack.length === 0)).toBe(true);
    });
});

describe('tickVersus attacks (spec §12.3)', () => {
    it('T23: hatching an egg enclosing 3 monsters sends exactly 3 fixed attack objects to the right', () => {
        // Arrange: a cap landing on three monsters over a base
        const state = versusWithLeft(boardWith([['base', 'm0', 'm1', 'm2'], [], [], []], [fallingAt(1, 'cap', 0)]));

        // Act
        const { events, state: next } = tickVersus(state, INPUTS, freshRngs(), GAME_CONFIG);

        // Assert
        expect(attackEvents(events)).toEqual([{ count: 3, from: 'left', type: 'attack-sent' }]);
        expect(next.right.pendingAttack).toHaveLength(3);
        expect(next.right.pendingAttack.every((attack) => attack.kind.startsWith('m'))).toBe(true);
        expect(next.left.board.columns).toEqual([[], [], [], []]);
    });

    it('T23: identical seeds reproduce identical attack compositions', () => {
        // Arrange
        const state = versusWithLeft(boardWith([['base', 'm0', 'm1', 'm2'], [], [], []], [fallingAt(1, 'cap', 0)]));

        // Act
        const first = tickVersus(state, INPUTS, freshRngs(), GAME_CONFIG);
        const second = tickVersus(state, INPUTS, freshRngs(), GAME_CONFIG);

        // Assert
        expect(first.state.right.pendingAttack).toEqual(second.state.right.pendingAttack);
    });

    it('a dry hatch (N = 0) sends no attack and queues nothing', () => {
        // Arrange: a cap landing on a bare base
        const state = versusWithLeft(boardWith([['base'], [], [], []], [fallingAt(1, 'cap', 0)]));

        // Act
        const { events, state: next } = tickVersus(state, INPUTS, freshRngs(), GAME_CONFIG);

        // Assert
        expect(attackEvents(events)).toEqual([]);
        expect(next.right.pendingAttack).toEqual([]);
    });
});

describe('tickVersus multi-hatch attacks (spec §12.3)', () => {
    it('two hatches in one tick enqueue both attacks in hatch order', () => {
        // Arrange: two caps landing the same tick, the first enclosing 2, the second 1
        const columns: readonly (readonly StackItem[])[] = [['base', 'm0', 'm1'], ['base', 'm2'], [], []];
        const state = versusWithLeft(boardWith(columns, [fallingAt(1, 'cap', 0), fallingAt(2, 'cap', 1)]));

        // Act
        const { events, state: next } = tickVersus(state, INPUTS, freshRngs(), GAME_CONFIG);

        // Assert
        expect(attackEvents(events)).toEqual([
            { count: 2, from: 'left', type: 'attack-sent' },
            { count: 1, from: 'left', type: 'attack-sent' }
        ]);
        expect(next.right.pendingAttack).toHaveLength(3);
    });
});

describe('tickVersus round adjudication (spec §12.3)', () => {
    it('T24: left clears while right plays on — left takes the token', () => {
        // Arrange: a base pair about to clear left's only column
        const state = versusWithLeft(boardWith([['base'], [], [], []], [fallingAt(1, 'base', 0)]));

        // Act
        const { events, state: next } = tickVersus(state, INPUTS, freshRngs(), GAME_CONFIG);

        // Assert
        expect(roundEvents(events)).toEqual([{ outcome: { side: 'left', type: 'cleared' }, type: 'round-decided' }]);
        expect(next.tokens).toEqual({ left: 1, right: 0 });
    });

    it('T25: left overflows — the round goes to the right', () => {
        // Arrange: a full column and one more monster landing on it
        const state = versusWithLeft(boardWith([FULL_COLUMN, [], [], []], [fallingAt(1, 'm1', 0)]));

        // Act
        const { events, state: next } = tickVersus(state, INPUTS, freshRngs(), GAME_CONFIG);

        // Assert
        expect(roundEvents(events)).toEqual([{ outcome: { side: 'left', type: 'overflow' }, type: 'round-decided' }]);
        expect(next.tokens).toEqual({ left: 0, right: 1 });
    });
});

describe('tickVersus simultaneous outcomes (spec §12.3)', () => {
    it('both sides clearing in the same tick awards a token each', () => {
        // Arrange
        const clearing = boardWith([['base'], [], [], []], [fallingAt(1, 'base', 0)]);
        const state = versusWith(clearing, clearing);

        // Act
        const { events, state: next } = tickVersus(state, INPUTS, freshRngs(), GAME_CONFIG);

        // Assert
        expect(roundEvents(events)).toEqual([{ outcome: { type: 'both-cleared' }, type: 'round-decided' }]);
        expect(next.tokens).toEqual({ left: 1, right: 1 });
    });

    it('both sides overflowing in the same tick is a drawn round — tokens unchanged', () => {
        // Arrange
        const overflowing = boardWith([FULL_COLUMN, [], [], []], [fallingAt(1, 'm1', 0)]);
        const state = versusWith(overflowing, overflowing);

        // Act
        const { events, state: next } = tickVersus(state, INPUTS, freshRngs(), GAME_CONFIG);

        // Assert
        expect(roundEvents(events)).toEqual([{ outcome: { type: 'draw-overflow' }, type: 'round-decided' }]);
        expect(next.tokens).toEqual({ left: 0, right: 0 });
        expect(next.round).toBe(state.round);
    });
});

describe('tickVersus match end and determinism (spec §12.3)', () => {
    it('T26: reaching the token target fires match-decided and starts no new round', () => {
        // Arrange: left one token from the match, about to clear the round
        const clearing = versusWithLeft(boardWith([['base'], [], [], []], [fallingAt(1, 'base', 0)]));
        const state: VersusState = { ...clearing, tokens: { left: 2, right: 0 } };

        // Act
        const { events, state: next } = tickVersus(state, INPUTS, freshRngs(), GAME_CONFIG);

        // Assert
        expect(events).toEqual([
            { outcome: { side: 'left', type: 'cleared' }, type: 'round-decided' },
            { type: 'match-decided', winner: 'left' }
        ]);
        expect(next.tokens).toEqual({ left: 3, right: 0 });
        expect(next.round).toBe(state.round);
    });

    it('identical seeds and inputs produce identical states and event streams after 500 ticks', () => {
        // Arrange / act
        const first = runTicks(500);
        const second = runTicks(500);

        // Assert
        expect(first.events).toEqual(second.events);
        expect(first.state).toEqual(second.state);
    });
});
