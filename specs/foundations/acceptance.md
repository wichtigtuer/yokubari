# Foundations — Acceptance

## Result plumbing

- `mapResult((n) => n + 1)(ok(1))` → `ok(2)`; applied to `err(e)` it passes the error through untouched (railway short-circuit).

## RNG determinism (spec §4)

- `createRng(42)` twice → both produce the identical first 100 numbers.
- `nextInt(createRng(7), 4)` called 1000 times only yields `0..3`.
- `weightedChoice(rng, [['m0', 1], ['m1', 0]])` always returns `ok('m0')`.
- `weightedChoice(rng, [])` → `{ type: 'error', error: { reason: 'empty' } }`.
- `weightedChoice(rng, [['m0', 0]])` → `{ type: 'error', error: { reason: 'no-positive-weight' } }`.

## Config invariants (spec §9, §17)

- `hatchTiers` is ascending in `maxEnclosed` and covers `0..6` contiguously.
- Maximum `maxEnclosed` (6) equals `stackCapacity - 1` (7 − 1), per spec §2 capacity logic.
- `typeWeights` contains exactly 6 entries (4 monsters, base, cap).
