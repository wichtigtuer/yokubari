import { describe, expect, it } from 'vite-plus/test';

import { dropTop, heightOf, pushItem, topOf } from './board';
import type { StackItem } from '../contracts/types';

describe('heightOf', () => {
    it('is zero for an empty column and grows with each item', () => {
        // Arrange / act / assert
        expect(heightOf([])).toBe(0);
        expect(heightOf(['m0', 'base'])).toBe(2);
    });
});

describe('topOf', () => {
    it('returns none for an empty column', () => {
        // Arrange / act
        const top = topOf([]);

        // Assert
        expect(top).toEqual({ type: 'none' });
    });

    it('returns the last item of a non-empty column', () => {
        // Arrange / act
        const top = topOf(['m1', 'm0']);

        // Assert
        expect(top).toEqual({ type: 'some', value: 'm0' });
    });
});

describe('pushItem', () => {
    it('places the item on top without mutating the input', () => {
        // Arrange
        const column: StackItem[] = ['m2'];

        // Act
        const pushed = pushItem(column, 'base');

        // Assert
        expect(pushed).toEqual(['m2', 'base']);
        expect(column).toEqual(['m2']);
    });
});

describe('dropTop', () => {
    it('removes the top item without mutating the input', () => {
        // Arrange
        const column: StackItem[] = ['m2', 'm0'];

        // Act
        const dropped = dropTop(column);

        // Assert
        expect(dropped).toEqual(['m2']);
        expect(column).toEqual(['m2', 'm0']);
    });

    it('drops to an empty column when one item rests', () => {
        // Arrange / act
        const dropped = dropTop(['base']);

        // Assert
        expect(dropped).toEqual([]);
    });
});
