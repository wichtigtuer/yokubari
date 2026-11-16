import type { BoardState, FallingObject, StackItem } from '../contracts/types';
import { describe, expect, it } from 'vite-plus/test';

import { GAME_CONFIG } from '../contracts/config';
import { createEmptyBoard } from './board';
import { swapTrays } from './swap';
import { toObjectId } from '../contracts/types';

const fallingAt = (id: number, column: FallingObject['column'], altitude: number): FallingObject => ({
    column,
    id: toObjectId(id),
    kind: 'm0',
    y: altitude
});

const boardWithColumns = (columns: readonly (readonly StackItem[])[]): BoardState => ({
    ...createEmptyBoard(),
    columns
});

describe('swapTrays stack exchange (spec §6)', () => {
    it('T13: exchanges whole stacks, preserving order, leaving other columns untouched', () => {
        // Arrange
        const board = boardWithColumns([['m3'], ['m0', 'm1'], ['m2'], ['base']]);

        // Act
        const result = swapTrays(board, 1, GAME_CONFIG);

        // Assert
        expect(result.board.columns).toEqual([['m3'], ['m2'], ['m0', 'm1'], ['base']]);
        expect(board.columns[1]).toEqual(['m0', 'm1']);
    });

    it('exchanges an empty column with a full one, trading emptiness', () => {
        // Arrange / act
        const result = swapTrays(boardWithColumns([['m0', 'm1'], [], ['m2'], []]), 0, GAME_CONFIG);

        // Assert
        expect(result.board.columns).toEqual([[], ['m0', 'm1'], ['m2'], []]);
        expect(result.carried).toEqual([]);
    });

    it('swapping two empty columns is legal and changes nothing', () => {
        // Arrange / act
        const result = swapTrays(boardWithColumns([['m0'], [], [], ['m1']]), 1, GAME_CONFIG);

        // Assert
        expect(result.board.columns).toEqual([['m0'], [], [], ['m1']]);
    });

    it('T14: non-adjacent pairs are unrepresentable at the type level', () => {
        // Arrange
        const board = createEmptyBoard();

        // Act: pair index 3 would name columns 3 and 4 — the compiler rejects it, so this never runs
        const rejected = (): void => {
            // @ts-expect-error non-adjacent pairs are not expressible
            swapTrays(board, 3, GAME_CONFIG);
        };

        // Assert: the function exists only so the type error above stays checked, not to be called
        expect(rejected).toBeTypeOf('function');
    });
});

type CarryCase = Readonly<{ altitude: number; carried: boolean; column: 1 | 2; lands: number; name: string }>;

const CARRY_COLUMNS: readonly (readonly StackItem[])[] = [[], ['m0', 'm1'], ['m2', 'm3', 'base'], []];
const CARRY_CASES: readonly CarryCase[] = [
    { altitude: 5, carried: false, column: 1, lands: 1, name: 'T21: an object above both stacks stays in its column' },
    { altitude: 3, carried: true, column: 1, lands: 2, name: 'T22: an object within reach is carried across' },
    {
        altitude: 3,
        carried: true,
        column: 2,
        lands: 1,
        name: 'carries at the exact boundary because the operator is >='
    }
];

describe('swapTrays carry rule (spec §6)', () => {
    for (const carryCase of CARRY_CASES) {
        it(carryCase.name, () => {
            // Arrange: stacks of heights 2 and 3 under pair 1
            const board: BoardState = {
                ...boardWithColumns(CARRY_COLUMNS),
                falling: [fallingAt(7, carryCase.column, carryCase.altitude)]
            };

            // Act
            const result = swapTrays(board, 1, GAME_CONFIG);

            // Assert
            if (carryCase.carried) {
                expect(result.carried).toEqual([toObjectId(7)]);
            } else {
                expect(result.carried).toEqual([]);
            }
            expect(result.board.falling[0].column).toBe(carryCase.lands);
        });
    }

    it('never carries objects in columns outside the swapped pair', () => {
        // Arrange: an object low over column 0, which the swap does not touch
        const board: BoardState = {
            ...boardWithColumns([['m3'], ['m0', 'm1'], ['m2'], []]),
            falling: [fallingAt(9, 0, 1)]
        };

        // Act
        const result = swapTrays(board, 1, GAME_CONFIG);

        // Assert
        expect(result.carried).toEqual([]);
        expect(result.board.falling[0].column).toBe(0);
    });
});
