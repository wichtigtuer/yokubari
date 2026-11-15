import { err, ok } from './result';
import type { Result } from './result';

/** Deterministic random source: each call returns the next float in [0, 1). */
export type Rng = () => number;

/** Reason a weighted draw cannot be made. */
export type WeightedChoiceError = Readonly<{ reason: 'empty' }> | Readonly<{ reason: 'no-positive-weight' }>;

const SEED_INCREMENT = 1_831_565_813;
const MIX_SHIFT_OUTER = 15;
const MIX_SHIFT_INNER = 7;
const MIX_SHIFT_FINAL = 14;
const ODD_MASK_LOW = 1;
const ODD_MASK_HIGH = 61;
const UINT32_RANGE = 4_294_967_296;
const AS_UINT32 = 0;

/**
 * Creates a mulberry32 generator for the given seed. Two generators built from the same seed
 * produce identical sequences, which is what makes replays and tests reproducible (spec §4).
 * The generator state lives inside the returned closure, one instance per consumer.
 */
export function createRng(seed: number): Rng {
    let state = seed >>> AS_UINT32;
    return (): number => {
        state = (state + SEED_INCREMENT) >>> AS_UINT32;
        let mixed = Math.imul(state ^ (state >>> MIX_SHIFT_OUTER), state | ODD_MASK_LOW);
        mixed ^= mixed + Math.imul(mixed ^ (mixed >>> MIX_SHIFT_INNER), mixed | ODD_MASK_HIGH);
        return ((mixed ^ (mixed >>> MIX_SHIFT_FINAL)) >>> AS_UINT32) / UINT32_RANGE;
    };
}

/** Draws an integer in 0..count-1 from the generator. */
export function nextInt(rng: Rng, count: number): number {
    return Math.floor(rng() * count);
}

const MIN_WEIGHT = 0;
const NO_ENTRIES = 0;

/** Walks the cumulative weights until the draw is covered; the first entry is the float-safe fallback. */
function pickWeighted<TValue>(entries: readonly (readonly [TValue, number])[], draw: number, fallback: TValue): TValue {
    let remaining = draw;
    for (const [item, weight] of entries) {
        remaining -= Math.max(MIN_WEIGHT, weight);
        if (remaining < MIN_WEIGHT) {
            return item;
        }
    }
    return fallback;
}

/**
 * Draws one entry proportionally to its weight. Non-positive weights never win; when no entry
 * can win the failure is a typed {@link Result} error, never an exception.
 */
export function weightedChoice<TValue>(
    rng: Rng,
    entries: readonly (readonly [TValue, number])[]
): Result<TValue, WeightedChoiceError> {
    if (entries.length === NO_ENTRIES) {
        return err({ reason: 'empty' });
    }
    let totalWeight = 0;
    for (const [, weight] of entries) {
        totalWeight += Math.max(MIN_WEIGHT, weight);
    }
    if (totalWeight <= MIN_WEIGHT) {
        return err({ reason: 'no-positive-weight' });
    }
    const [[firstItem]] = entries;
    return ok(pickWeighted(entries, rng() * totalWeight, firstItem));
}
