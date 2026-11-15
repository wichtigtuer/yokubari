import type { GameConfig, HatchTier } from '../contracts/config';
import type { Option, Result } from '../utils/result';
import { err, none, ok, some } from '../utils/result';
import type { StackItem } from '../contracts/types';

/** Reason no hatch tier applies to an enclosed count. */
export type HatchTierError = Readonly<{ reason: 'enclosed-out-of-range'; enclosed: number }>;

/** Outcome of a cap half landing on a column (spec §9). */
export type EggResolution =
    | Readonly<{ type: 'cap-vanished' }>
    | Readonly<{ type: 'hatched'; column: StackItem[]; enclosed: number; tier: HatchTier; points: number }>;

/** Index of the topmost base half in a column — the one a landing cap binds (spec §9 [M]). */
export function findTopmostBaseIndex(column: readonly StackItem[]): Option<number> {
    for (let index = column.length - 1; index >= 0; index -= 1) {
        if (column[index] === 'base') {
            return some(index);
        }
    }
    return none();
}

/** Score tier for an egg enclosing the given number of monsters (spec §9 tier table). */
export function hatchTierFor(enclosed: number, config: GameConfig): Result<HatchTier, HatchTierError> {
    if (enclosed < 0 || enclosed > config.stackCapacity - 1) {
        return err({ enclosed, reason: 'enclosed-out-of-range' });
    }
    for (const candidate of config.hatchTiers) {
        if (enclosed <= candidate.maxEnclosed) {
            return ok(candidate);
        }
    }
    return err({ enclosed, reason: 'enclosed-out-of-range' });
}

/**
 * Resolves a landing cap half (spec §9): without a base half it vanishes; otherwise it binds the
 * topmost base half, the base and everything above it hatch, and everything below survives.
 */
export function resolveCap(column: readonly StackItem[], config: GameConfig): EggResolution {
    const baseIndex = findTopmostBaseIndex(column);
    if (baseIndex.type === 'none') {
        return { type: 'cap-vanished' };
    }
    const enclosed = column.length - 1 - baseIndex.value;
    const tierResult = hatchTierFor(enclosed, config);
    if (tierResult.type === 'error') {
        // Unreachable: enclosed stays within 0..stackCapacity-1, which the config invariant tests cover
        return { type: 'cap-vanished' };
    }
    return {
        column: column.slice(0, baseIndex.value),
        enclosed,
        points: tierResult.value.points,
        tier: tierResult.value,
        type: 'hatched'
    };
}
