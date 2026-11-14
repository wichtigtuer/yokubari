# Modes & Progression — Acceptance

## Scoring (spec §11)

- Events `scored(5)` + `hatched(tier 2, 100)` produce `score: 105`, `hatched: 1`; no multipliers ever apply.
- A `cap-vanished` landing adds 0.

## Endless progression (spec §12.1)

- T17: `registerFallen` with the 40th landed object increments `level` by 1, resets `rampCounter` to 0 (the dip), and sets `pendingBatchSize: 3`; after that batch, it returns to 2.
- `fallenCount` is cumulative across level-ups (41st object does not retrigger).
- `advanceRamp` increments the ramp each tick up to the configured maximum; fall interval shortens accordingly (verified via `fallIntervalTicks`).
- Level lookups above the table clamp to the last interval entry — no crash at high levels.

## Stage-clear (spec §12.2)

- `generatePrefill(rng, 3)` yields columns totalling ~3 rows, same seed → same field.
- No prefill contains vertically adjacent identical monsters (no instant matches at start).
- Every prefill column decomposes into even-length single-kind runs (solvable by construction).
- T18: `isStageCleared` is true only when all columns are empty and no falling or pending objects exist.
- `stageBonus(1) → 50`, `stageBonus(5) → 250`, `stageBonus(8) → 400`, `stageBonus(30) → 1500` (clamps at the last configured row).

## Adaptive supply (spec §4 [M/D])

- With ≤ threshold objects remaining, generated kinds are a subset of kinds that clear exposed tops.
- Above the threshold, weights are the configured defaults.
