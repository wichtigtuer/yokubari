import { describe, expect, it } from 'vite-plus/test';

import { GAME_CONFIG } from '../contracts/config';
import type { StackItem } from '../contracts/types';
import { landObject } from './overflow';

const FULL_MISMATCH_TOP: readonly StackItem[] = ['m3', 'm2', 'm0', 'm3', 'm2', 'm0', 'm1'];
const FULL_MATCH_TOP: readonly StackItem[] = ['m3', 'm2', 'm0', 'm3', 'm2', 'm1', 'm0'];
const FULL_EGG: readonly StackItem[] = ['base', 'm0', 'm1', 'm2', 'm3', 'm0', 'm1'];

describe('landObject overflow rule (spec §10)', () => {
    it('T19: stacking past capacity on a full column ends the game', () => {
        // Arrange / act
        const result = landObject(FULL_MISMATCH_TOP, 'm0', GAME_CONFIG);

        // Assert
        expect(result.gameOver).toBe(true);
        expect(result.outcome.type).toBe('stacked');
    });

    it('T20: a pair clear on a full column resolves before the overflow check', () => {
        // Arrange / act
        const result = landObject(FULL_MATCH_TOP, 'm0', GAME_CONFIG);

        // Assert
        expect(result.gameOver).toBe(false);
        expect(result.outcome).toMatchObject({ points: 5, type: 'pair-cleared' });
    });

    it('T10: a hatch on a 7-high column is not game over', () => {
        // Arrange / act
        const result = landObject(FULL_EGG, 'cap', GAME_CONFIG);

        // Assert
        expect(result.gameOver).toBe(false);
        expect(result.outcome).toMatchObject({ enclosed: 6, points: 500, type: 'hatched' });
    });

    it('T6: a cap vanishing on a full column is not game over', () => {
        // Arrange / act
        const result = landObject(FULL_MISMATCH_TOP, 'cap', GAME_CONFIG);

        // Assert
        expect(result.gameOver).toBe(false);
        expect(result.outcome).toEqual({ type: 'cap-vanished' });
    });
});
