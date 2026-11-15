import { describe, expect, it } from 'vite-plus/test';

import { pipe } from './pipe';

describe('pipe', () => {
    it('returns the value unchanged with no stages', () => {
        // Arrange / act
        const outcome = pipe(41);

        // Assert
        expect(outcome).toBe(41);
    });

    it('applies a single stage', () => {
        // Arrange / act
        const outcome = pipe(2, (count: number) => count + 1);

        // Assert
        expect(outcome).toBe(3);
    });

    it('composes left to right, feeding each stage the previous result', () => {
        // Arrange / act
        const outcome = pipe(
            1,
            (count: number) => count + 10,
            (count: number) => count * 2,
            (count: number) => `total:${count}`
        );

        // Assert: ((1 + 10) * 2) would differ under right-to-left composition
        expect(outcome).toBe('total:22');
    });

    it('preserves types across stages', () => {
        // Arrange / act: each stage changes the type; a wrong order fails to compile
        const outcome = pipe(
            'm0',
            (kind: string) => kind.length,
            (length: number) => length > 1,
            (flag: boolean) => ({ flag })
        );

        // Assert
        expect(outcome).toEqual({ flag: true });
    });
});
