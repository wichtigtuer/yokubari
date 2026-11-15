# Spawning & Gravity — Spec

## Goal

Make objects appear and fall. A seeded batch generator produces batches of independent single-cell objects (2 per ordinary batch) in distinct columns with staggered entry delays, using configurable type weights. A gravity model advances each falling object in discrete steps at a speed derived from speed mode, level, ramp counter, and held-Down soft drop. A tick pipeline wires input-free simulation steps in the order of spec §14 so a landing resolves immediately on contact. Covers spec §4, §7 and acceptance test T15.

## User-visible behaviour

- None directly; exercised through the shell. Determinism here is what makes E2E replay possible later.

## Out of scope

- Input handling (Down arrives as a boolean already read by the caller).
- Tray swapping and its carry rule (separate feature).
- Level-up effects on speed (the ramp counter is an input here; progression owns it).
- Stage-clear prefill and adaptive supply (modes feature).
- Versus attack injection (versus feature).

## Open questions (resolved)

- _Columns and stagger for a batch [U]:_ resolved per spec §4 suggested default — distinct columns chosen by the RNG, each object with an increasing spawn delay in ticks, both from config.
- _Type distribution [U]:_ resolved — uniform over the six types, stored as `typeWeights` in config.
- _Fall speed numbers [U]:_ resolved — placeholder tick-interval table per speedMode × level in config; the mechanics (accumulator + steps-per-cell) are fixed, the numbers are data.
- _Soft-drop multiplier [U]:_ resolved — placeholder factor dividing the interval while Down is held; never an instant drop.
- _Landing on mid-fall stack change:_ an object lands when its altitude reaches the current column height at step time; swaps adjust the target in the swap feature.

## Edge cases

- A spawned object starts above the failure line (y > 7) and must not trigger overflow until it lands.
- Staggered objects of one batch resolve independently; a swap can route them separately (spec §4).
- `weightedChoice` errors (misconfigured weights) surface as `Result.error`, never a thrown exception.
- Soft drop at the fastest interval still advances step-by-step — no teleporting to the stack (T15).
- All six object types fall at the same rate (spec §7 [L]).
- No lock delay: contact resolves within the same tick (spec §7 [D]).
