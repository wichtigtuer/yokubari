/** Deterministic random source: each call returns the next float in [0, 1). */
export type Rng = () => number;

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
