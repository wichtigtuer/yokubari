import { describe, expect, it } from 'vite-plus/test';

import { GAME_CONFIG } from '../contracts/config';
import type { StackItem } from '../contracts/types';
import { createRng } from '../utils/random';
import { generatePrefill } from './stage';

const runLengths = (column: readonly StackItem[]): number[] => {
    const runs: number[] = [];
    let current = 0;
    for (let index = 0; index <= column.length; index += 1) {
        if (index < column.length && (index === 0 || column[index] === column[index - 1])) {
            current += 1;
        } else {
            runs.push(current);
            current = 1;
        }
    }
    return runs;
};

describe('generatePrefill (spec §12.2)', () => {
    it('starts levels 1-5 at roughly 1-5 rows per column', () => {
        // Arrange / act
        const heights = [1, 2, 3, 4, 5].map((level) => {
            const prefill = generatePrefill(createRng(level), level, GAME_CONFIG);
            return prefill.map((column) => column.length);
        });

        // Assert: even runs round odd levels up to the next pair
        expect(heights).toEqual([
            [2, 2, 2, 2],
            [2, 2, 2, 2],
            [4, 4, 4, 4],
            [4, 4, 4, 4],
            [6, 6, 6, 6]
        ]);
    });

    it('decomposes every column into even-length single-kind runs — no odd run can strand a monster', () => {
        // Arrange / act
        const prefill = generatePrefill(createRng(99), 5, GAME_CONFIG);

        // Assert
        for (const column of prefill) {
            expect(runLengths(column).every((run) => run % GAME_CONFIG.prefillRunHeight === 0)).toBe(true);
        }
    });

    it('reproduces the same field for the same seed', () => {
        // Arrange / act
        const first = generatePrefill(createRng(3), 3, GAME_CONFIG);
        const second = generatePrefill(createRng(3), 3, GAME_CONFIG);

        // Assert
        expect(second).toEqual(first);
    });
});
