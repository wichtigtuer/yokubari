import { describe, expect, it } from 'vite-plus/test';

import { moveCursorLeft, moveCursorRight } from './cursor';

describe('cursor movement (spec §5)', () => {
    it('clamps at pair 0 on Left and at pair 2 on Right — no wrap-around', () => {
        // Arrange / act / assert
        expect(moveCursorLeft(0)).toBe(0);
        expect(moveCursorRight(2)).toBe(2);
    });

    it('moves one pair per press in mid-range', () => {
        // Arrange / act / assert
        expect(moveCursorLeft(1)).toBe(0);
        expect(moveCursorRight(1)).toBe(2);
        expect(moveCursorRight(0)).toBe(1);
        expect(moveCursorLeft(2)).toBe(1);
    });
});
