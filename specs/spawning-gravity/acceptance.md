# Spawning & Gravity — Acceptance

## Batch generation (spec §4)

- `generateBatch(rng, config, 2)` returns 2 objects with pairwise distinct columns and strictly increasing `spawnDelay`.
- The same seed always produces the same batch sequence (replay determinism).
- With uniform weights, all six types appear across 600 generated objects (statistical sanity, seeded assertion).
- `generateBatch(rng, config, 0)` → `Result.error({ reason: 'invalid-size' })`.

## Gravity (spec §7)

- `fallIntervalTicks` with `softDrop: false` equals the config table value for the given mode/level.
- T15: with `softDrop: true` the interval is smaller but ≥ 1 tick — objects still step cell-by-cell, never teleport.
- HIGH speed yields a smaller interval than LOW at the same level.
- `hasLanded({ y: 3 }, 3)` is true; `{ y: 3.25 }` at height 3 is false until a step crosses the height.

## Tick pipeline (spec §14)

- A falling object whose step reaches its column height resolves in the same tick (immediate, no lock delay).
- Events arrive in landing order; a `game-over` event ends further resolution that tick.
- When `falling` empties, the next tick emits `batch-spawned` with the configured batch size.
