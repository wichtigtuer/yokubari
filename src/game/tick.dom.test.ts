import type { BoardState, FallingObject, StackItem } from '../contracts/types';
import { describe, expect, it } from 'vite-plus/test';

import type { FallContext } from './gravity';
import { GAME_CONFIG } from '../contracts/config';
import { createEmptyBoard } from './board';
import { createRng } from '../utils/random';
import { tickBoard } from './tick';
import { toObjectId } from '../contracts/types';

const CONTEXT: FallContext = {
    batchSize: GAME_CONFIG.batchSize,
    level: 1,
    rampCounter: 0,
    softDrop: false,
    speedMode: 'low'
};
const STEP = 1 / GAME_CONFIG.stepsPerCell;
const [INTERVAL] = GAME_CONFIG.fallIntervals.low;

const boardWith = (
    columns: readonly (readonly StackItem[])[],
    falling: readonly FallingObject[],
    fallAccumulator: number
): BoardState => ({ columns, fallAccumulator, falling, nextObjectId: 100, pending: [] });

const fallingAt = (
    id: number,
    kind: FallingObject['kind'],
    column: FallingObject['column'],
    altitude: number
): FallingObject => ({
    column,
    id: toObjectId(id),
    kind,
    y: altitude
});

describe('tickBoard landing resolution (spec §14)', () => {
    it('resolves a landing in the same tick the step reaches the stack — no lock delay', () => {
        // Arrange: one step above an empty column, one tick from the next fall step
        const board = boardWith([[], [], [], []], [fallingAt(1, 'm0', 0, STEP)], INTERVAL - 1);

        // Act
        const result = tickBoard(board, CONTEXT, createRng(1), GAME_CONFIG);

        // Assert
        expect(result.landedCount).toBe(1);
        expect(result.board.columns[0]).toEqual(['m0']);
        expect(result.board.falling).toEqual([]);
    });

    it('emits a scored event in the tick a pair clears', () => {
        // Arrange
        const board = boardWith([['m0'], [], [], []], [fallingAt(2, 'm0', 0, 1 + STEP)], INTERVAL - 1);

        // Act
        const result = tickBoard(board, CONTEXT, createRng(1), GAME_CONFIG);

        // Assert
        expect(result.events).toEqual([{ points: 5, type: 'scored' }]);
        expect(result.board.columns[0]).toEqual([]);
    });

    it('does not advance objects before the fall interval elapses', () => {
        // Arrange: same setup, but the accumulator is not yet due
        const board = boardWith([[], [], [], []], [fallingAt(3, 'm1', 1, STEP)], INTERVAL - 2);

        // Act
        const result = tickBoard(board, CONTEXT, createRng(1), GAME_CONFIG);

        // Assert
        expect(result.landedCount).toBe(0);
        expect(result.board.falling[0].y).toBe(STEP);
        expect(result.board.fallAccumulator).toBe(INTERVAL - 1);
    });
});

describe('tickBoard spawn cadence (spec §4/§14)', () => {
    it('emits batch-spawned on the first tick and enters the delay-free object at once', () => {
        // Arrange / act
        const result = tickBoard(createEmptyBoard(), CONTEXT, createRng(5), GAME_CONFIG);
        const [event] = result.events;

        // Assert
        expect(event.type).toBe('batch-spawned');
        if (event.type === 'batch-spawned') {
            expect(event.batch.objects).toHaveLength(GAME_CONFIG.batchSize);
        }
        expect(result.board.falling).toHaveLength(1);
        expect(result.board.pending).toHaveLength(GAME_CONFIG.batchSize - 1);
        expect(result.board.falling[0].y).toBe(GAME_CONFIG.stackCapacity + 1);
    });

    it('emits batch-spawned on the tick after the field empties', () => {
        // Arrange: the last falling object lands this tick
        const rng = createRng(9);
        const board = boardWith([[], [], [], []], [fallingAt(1, 'm0', 0, STEP)], INTERVAL - 1);

        // Act
        const landed = tickBoard(board, CONTEXT, rng, GAME_CONFIG);
        const spawned = tickBoard(landed.board, CONTEXT, rng, GAME_CONFIG);
        const [event] = spawned.events;

        // Assert
        expect(landed.board.falling).toEqual([]);
        expect(event.type).toBe('batch-spawned');
    });

    it('enters a pending object when its stagger elapses, with a fresh id', () => {
        // Arrange
        const board: BoardState = {
            ...createEmptyBoard(),
            pending: [{ column: 2, kind: 'base', remainingTicks: 1 }]
        };

        // Act
        const result = tickBoard(board, CONTEXT, createRng(3), GAME_CONFIG);

        // Assert
        expect(result.board.pending).toEqual([]);
        expect(result.board.falling).toEqual([
            { column: 2, id: toObjectId(0), kind: 'base', y: GAME_CONFIG.stackCapacity + 1 }
        ]);
        expect(result.board.nextObjectId).toBe(1);
    });
});

describe('tickBoard game-over ordering (spec §14)', () => {
    it('emits game-over and resolves nothing further that tick', () => {
        // Arrange: column 0 overflows; a second object would have landed in column 1
        const full: StackItem[] = ['m3', 'm2', 'm0', 'm3', 'm2', 'm0', 'm1'];
        const falling = [fallingAt(4, 'm0', 0, 7 + STEP), fallingAt(5, 'm1', 1, STEP)];
        const board = boardWith([full, [], [], []], falling, INTERVAL - 1);

        // Act
        const result = tickBoard(board, CONTEXT, createRng(1), GAME_CONFIG);

        // Assert
        expect(result.events).toEqual([{ type: 'game-over' }]);
        expect(result.landedCount).toBe(1);
        expect(result.board.falling).toEqual([{ ...falling[1], y: STEP - STEP }]);
        expect(result.board.columns[1]).toEqual([]);
    });
});
