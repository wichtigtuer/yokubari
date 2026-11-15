import type { BoardState, StackItem } from '../contracts/types';
import { describe, expect, it } from 'vite-plus/test';

import { GAME_CONFIG } from '../contracts/config';
import { createEmptyBoard } from './board';
import { swapTrays } from './swap';

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
