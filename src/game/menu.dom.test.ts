import { adjustMenuField, defaultMenuParams } from './menu';
import { describe, expect, it } from 'vite-plus/test';

import { GAME_CONFIG } from '../contracts/config';

const BASE = defaultMenuParams(GAME_CONFIG);

describe('adjustMenuField (spec §12.0/§5)', () => {
    it('clamps level to the configured range', () => {
        // Arrange / act / assert
        expect(adjustMenuField(BASE, 'level', -1, GAME_CONFIG).level).toBe(1);
        expect(adjustMenuField({ ...BASE, level: 5 }, 'level', 1, GAME_CONFIG).level).toBe(5);
        expect(adjustMenuField({ ...BASE, level: 3 }, 'level', -1, GAME_CONFIG).level).toBe(2);
    });

    it('toggles mode and speed', () => {
        // Arrange / act / assert
        expect(adjustMenuField(BASE, 'mode', 1, GAME_CONFIG).mode).toBe('B');
        expect(adjustMenuField({ ...BASE, mode: 'B' }, 'mode', -1, GAME_CONFIG).mode).toBe('A');
        expect(adjustMenuField(BASE, 'speed', 1, GAME_CONFIG).speed).toBe('high');
        expect(adjustMenuField({ ...BASE, speed: 'high' }, 'speed', -1, GAME_CONFIG).speed).toBe('low');
    });

    it('cycles music off through the tracks and back, in both directions', () => {
        // Arrange / act / assert
        expect(adjustMenuField(BASE, 'music', 1, GAME_CONFIG).music).toBe(0);
        expect(adjustMenuField({ ...BASE, music: 2 }, 'music', 1, GAME_CONFIG).music).toBe('off');
        expect(adjustMenuField(BASE, 'music', -1, GAME_CONFIG).music).toBe(2);
    });

    it('editing one field leaves the others unchanged', () => {
        // Arrange
        const params = { level: 3, mode: 'B', music: 1, speed: 'high' } as const;

        // Act
        const adjusted = adjustMenuField(params, 'level', 1, GAME_CONFIG);

        // Assert
        expect(adjusted).toEqual({ level: 4, mode: 'B', music: 1, speed: 'high' });
    });
});
