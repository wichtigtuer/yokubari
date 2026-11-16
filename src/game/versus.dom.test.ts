import { createVersus, startRound } from './versus';
import { describe, expect, it } from 'vite-plus/test';

import { GAME_CONFIG } from '../contracts/config';
import type { VersusState } from './versus';

const withTokens = (state: VersusState): VersusState => ({ ...state, tokens: { left: 2, right: 1 } });

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
