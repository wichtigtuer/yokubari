import type { BoardState, FallingObject, StackItem } from '../contracts/types';
import type { SideInput, VersusState } from './versus';
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

/** A cap about to land: altitude zero always satisfies the landing check. */
const capAt = (id: number, column: FallingObject['column']): FallingObject => ({
    column,
    id: toObjectId(id),
    kind: 'cap',
    y: 0
});

const versusWithLeft = (board: BoardState): VersusState => {
    const fresh = createVersus(GAME_CONFIG);
    return { ...fresh, left: { ...fresh.left, board } };
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
        const state = versusWithLeft(boardWith([['base', 'm0', 'm1', 'm2'], [], [], []], [capAt(1, 0)]));

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
        const state = versusWithLeft(boardWith([['base', 'm0', 'm1', 'm2'], [], [], []], [capAt(1, 0)]));

        // Act
        const first = tickVersus(state, INPUTS, freshRngs(), GAME_CONFIG);
        const second = tickVersus(state, INPUTS, freshRngs(), GAME_CONFIG);

        // Assert
        expect(first.state.right.pendingAttack).toEqual(second.state.right.pendingAttack);
    });

    it('a dry hatch (N = 0) sends no attack and queues nothing', () => {
        // Arrange: a cap landing on a bare base
        const state = versusWithLeft(boardWith([['base'], [], [], []], [capAt(1, 0)]));

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
        const state = versusWithLeft(boardWith(columns, [capAt(1, 0), capAt(2, 1)]));

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
