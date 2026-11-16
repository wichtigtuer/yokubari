import { describe, expect, it } from 'vite-plus/test';

import { GAME_CONFIG } from '../contracts/config';
import { resolveLanding } from './resolve';

describe('resolveLanding (spec §8)', () => {
    it('T1: a monster landing on the same monster annihilates both for 5 points', () => {
        // Arrange / act
        const outcome = resolveLanding(['m0'], 'm0', GAME_CONFIG);

        // Assert
        expect(outcome).toEqual({ column: [], points: 5, type: 'pair-cleared' });
    });

    it('T2: a monster landing on a different monster stacks', () => {
        // Arrange / act
        const outcome = resolveLanding(['m1'], 'm0', GAME_CONFIG);

        // Assert
        expect(outcome).toEqual({ column: ['m1', 'm0'], type: 'stacked' });
    });

    it('T3: a base half landing on an empty tray stays at the bottom', () => {
        // Arrange / act
        const outcome = resolveLanding([], 'base', GAME_CONFIG);

        // Assert
        expect(outcome).toEqual({ column: ['base'], type: 'stacked' });
    });

    it('T4: a base half landing on a base half annihilates both for 5 points', () => {
        // Arrange / act
        const outcome = resolveLanding(['base'], 'base', GAME_CONFIG);

        // Assert
        expect(outcome).toEqual({ column: [], points: 5, type: 'pair-cleared' });
    });

    it('T5: a base half landing on a monster stacks', () => {
        // Arrange / act
        const outcome = resolveLanding(['m2'], 'base', GAME_CONFIG);

        // Assert
        expect(outcome).toEqual({ column: ['m2', 'base'], type: 'stacked' });
    });

    it('a buried identical monster never matches; only the top is compared', () => {
        // Arrange / act
        const outcome = resolveLanding(['m0', 'm1'], 'm0', GAME_CONFIG);

        // Assert
        expect(outcome).toEqual({ column: ['m0', 'm1', 'm0'], type: 'stacked' });
    });
});
