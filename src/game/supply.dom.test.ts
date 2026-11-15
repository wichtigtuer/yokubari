import type { BoardState, StackItem } from '../contracts/types';
import { describe, expect, it } from 'vite-plus/test';

import { GAME_CONFIG } from '../contracts/config';
import { adaptWeights } from './supply';
import { createEmptyBoard } from './board';

const boardWithColumns = (columns: readonly (readonly StackItem[])[]): BoardState => ({
    ...createEmptyBoard(),
    columns
});

const adaptedKinds = (board: BoardState): string[] => adaptWeights(board, GAME_CONFIG).map(([kind]) => kind);

describe('adaptWeights (spec §4 [M/D])', () => {
    it('returns the configured defaults above the threshold', () => {
        // Arrange: five stacked objects — one more than the threshold of four
        const board = boardWithColumns([['m0', 'm1'], ['m2', 'm3'], ['m0'], []]);

        // Act / Assert
        expect(adaptWeights(board, GAME_CONFIG)).toEqual(GAME_CONFIG.typeWeights);
    });

    it('supplies only the monster kinds that clear exposed tops at the threshold', () => {
        // Arrange: three objects left, tops m1 and m3
        const board = boardWithColumns([['m0', 'm1'], ['m3'], [], []]);

        // Act
        const kinds = adaptedKinds(board);

        // Assert: weights keep the config order — no sort needed
        expect(kinds).toEqual(['m1', 'm3']);
    });

    it('supplies base for a base top and cap when a base sits under monsters', () => {
        // Arrange: one base top, one buried base
        const board = boardWithColumns([['base'], ['m0', 'base', 'm1'], [], []]);

        // Act
        const kinds = adaptedKinds(board);

        // Assert
        expect(kinds).toHaveLength(3);
        expect(kinds).toEqual(expect.arrayContaining(['base', 'cap', 'm1']));
    });

    it('falls back to the defaults when nothing needs clearing', () => {
        // Arrange / act / assert
        expect(adaptWeights(createEmptyBoard(), GAME_CONFIG)).toEqual(GAME_CONFIG.typeWeights);
    });
});
