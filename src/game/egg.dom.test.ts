import { describe, expect, it } from 'vite-plus/test';

import { findTopmostBaseIndex, hatchTierFor } from './egg';
import { GAME_CONFIG } from '../contracts/config';
import type { StackItem } from '../contracts/types';
import { resolveLanding } from './resolve';

describe('hatchTierFor', () => {
    it('maps the tier boundaries 0, 1-3, 4-5 and 6 to tiers 1-4 (spec §9)', () => {
        // Arrange
        const expectations = [
            { enclosed: 0, points: 50, tier: 1 },
            { enclosed: 1, points: 100, tier: 2 },
            { enclosed: 3, points: 100, tier: 2 },
            { enclosed: 4, points: 200, tier: 3 },
            { enclosed: 5, points: 200, tier: 3 },
            { enclosed: 6, points: 500, tier: 4 }
        ];

        // Act / Assert
        for (const { enclosed, points, tier } of expectations) {
            const outcome = hatchTierFor(enclosed, GAME_CONFIG);
            expect(outcome.type).toBe('ok');
            if (outcome.type === 'ok') {
                expect(outcome.value.points).toBe(points);
                expect(outcome.value.tier).toBe(tier);
            }
        }
    });

    it('rejects enclosed counts outside 0..stackCapacity-1', () => {
        // Arrange / act
        const tooLow = hatchTierFor(-1, GAME_CONFIG);
        const tooHigh = hatchTierFor(7, GAME_CONFIG);

        // Assert
        expect(tooLow).toEqual({ error: { enclosed: -1, reason: 'enclosed-out-of-range' }, type: 'error' });
        expect(tooHigh).toEqual({ error: { enclosed: 7, reason: 'enclosed-out-of-range' }, type: 'error' });
    });
});

type HatchCase = Readonly<{
    name: string;
    column: readonly StackItem[];
    enclosed: number;
    points: number;
    tier: number;
}>;

const HATCH_CASES: readonly HatchCase[] = [
    { column: ['base'], enclosed: 0, name: 'T7: a lone base hatches tier 1 for +50', points: 50, tier: 1 },
    {
        column: ['base', 'm0', 'm1', 'm2'],
        enclosed: 3,
        name: 'T8: 3 enclosed hatches tier 2 for +100',
        points: 100,
        tier: 2
    },
    {
        column: ['base', 'm0', 'm1', 'm2', 'm3', 'm0'],
        enclosed: 5,
        name: 'T9: 5 enclosed hatches tier 3 for +200',
        points: 200,
        tier: 3
    },
    {
        column: ['base', 'm0', 'm1', 'm2', 'm3', 'm0', 'm1'],
        enclosed: 6,
        name: 'T10: a 7-high column enclosing 6 hatches tier 4 for +500',
        points: 500,
        tier: 4
    }
];

describe('resolveLanding cap branch (spec §9)', () => {
    it('T6: a cap landing with no base present vanishes for 0 points', () => {
        // Arrange / act
        const outcome = resolveLanding(['m0'], 'cap', GAME_CONFIG);

        // Assert
        expect(outcome).toEqual({ type: 'cap-vanished' });
    });

    for (const hatchCase of HATCH_CASES) {
        it(hatchCase.name, () => {
            // Arrange / act
            const outcome = resolveLanding(hatchCase.column, 'cap', GAME_CONFIG);

            // Assert
            expect(outcome).toMatchObject({
                column: [],
                enclosed: hatchCase.enclosed,
                points: hatchCase.points,
                type: 'hatched'
            });
            if (outcome.type === 'hatched') {
                expect(outcome.tier.tier).toBe(hatchCase.tier);
            }
        });
    }

    it('T11: objects below the bound base survive the hatch untouched', () => {
        // Arrange / act
        const outcome = resolveLanding(['m3', 'base', 'm0', 'm1'], 'cap', GAME_CONFIG);

        // Assert
        expect(outcome).toMatchObject({ column: ['m3'], enclosed: 2, type: 'hatched' });
    });

    it('T12: the cap binds the topmost base, so deeper bases survive', () => {
        // Arrange / act
        const outcome = resolveLanding(['base', 'm0', 'base', 'm1'], 'cap', GAME_CONFIG);

        // Assert
        expect(outcome).toMatchObject({ column: ['base', 'm0'], enclosed: 1, type: 'hatched' });
    });
});

describe('findTopmostBaseIndex', () => {
    it('returns none when no base half rests in the column', () => {
        // Arrange / act / assert
        expect(findTopmostBaseIndex([])).toEqual({ type: 'none' });
        expect(findTopmostBaseIndex(['m0', 'm1'])).toEqual({ type: 'none' });
    });

    it('binds the topmost base half when several exist (spec §9 [M])', () => {
        // Arrange / act
        const index = findTopmostBaseIndex(['base', 'm0', 'base', 'm1']);

        // Assert
        expect(index).toEqual({ type: 'some', value: 2 });
    });
});
