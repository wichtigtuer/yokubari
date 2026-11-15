import { describe, expect, it } from 'vite-plus/test';

import { err, flatMapResult, mapResult, none, ok, some } from './result';
import type { Result } from './result';

describe('result constructors', () => {
    it('ok wraps a value', () => {
        // Arrange / act
        const outcome = ok(1);

        // Assert
        expect(outcome).toEqual({ type: 'ok', value: 1 });
    });

    it('err wraps an error reason', () => {
        // Arrange / act
        const outcome = err({ reason: 'empty' });

        // Assert
        expect(outcome).toEqual({ error: { reason: 'empty' }, type: 'error' });
    });

    it('some wraps a value and none is absent', () => {
        // Arrange / act
        const present = some('m0');
        const absent = none();

        // Assert
        expect(present).toEqual({ type: 'some', value: 'm0' });
        expect(absent).toEqual({ type: 'none' });
    });
});

describe('mapResult', () => {
    it('transforms the success value', () => {
        // Arrange
        const increment = mapResult((count: number) => count + 1);

        // Act
        const outcome = increment(ok(1));

        // Assert
        expect(outcome).toEqual({ type: 'ok', value: 2 });
    });

    it('passes an error through untouched', () => {
        // Arrange
        const failure: Result<number, { reason: 'empty' }> = err({ reason: 'empty' });
        const increment = mapResult((count: number) => count + 1);

        // Act
        const outcome = increment(failure);

        // Assert
        expect(outcome).toBe(failure);
    });
});

describe('flatMapResult', () => {
    it('chains a fallible step onto a success', () => {
        // Arrange
        const halve = flatMapResult((count: number): Result<number, { reason: 'odd' }> => {
            if (count % 2 === 0) {
                return ok(count / 2);
            }
            return err({ reason: 'odd' });
        });

        // Act
        const divided = halve(ok(4));
        const rejected = halve(ok(3));

        // Assert
        expect(divided).toEqual({ type: 'ok', value: 2 });
        expect(rejected).toEqual({ error: { reason: 'odd' }, type: 'error' });
    });

    it('short-circuits on an incoming error without calling the step', () => {
        // Arrange
        const failure: Result<number, { reason: 'empty' }> = err({ reason: 'empty' });
        let calls = 0;
        const step = flatMapResult((count: number): Result<number, { reason: 'empty' }> => {
            calls += 1;
            return ok(count);
        });

        // Act
        const outcome = step(failure);

        // Assert
        expect(outcome).toBe(failure);
        expect(calls).toBe(0);
    });
});
