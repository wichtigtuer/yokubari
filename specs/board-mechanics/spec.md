# Board Mechanics — Spec

## Goal

Implement the pure heart of the game: what happens when a falling object meets a stack. Monster pairs annihilate, base-half pairs annihilate, cap halves complete eggs against the topmost base half and award tiered hatch points, and anything else stacks. Includes the overflow rule that ends the game when a stack would exceed 7 objects. Covers spec §8, §9, §10 and acceptance tests T1–T12, T19, T20.

## User-visible behaviour

- None directly; this is the domain core. Observable through later features.

## Out of scope

- Gravity, spawning, input, tray swapping, modes, versus attacks (the _attack count_ N is produced here, its delivery is not).
- Score aggregation and the hatched counter (they consume the points/enclosed values this feature returns).
- Any rendering or animation.

## Open questions (resolved)

- _Cap half on a full column:_ resolved per spec §10 default — resolve the cap first; a hatch or vanish never overflows.
- _Match versus overflow priority on a full column:_ resolved per spec §8 note — resolution happens before the overflow check (T20).
- _Which base half binds when several exist in a column:_ resolved per spec §9 [M] — the topmost base half.
- _Result encoding:_ each landing returns a discriminated union describing exactly one outcome; callers never re-derive what happened.

## Edge cases

- Monster landing on an empty tray always stacks (no crash on missing top).
- Base half landing on an empty tray stays at the bottom (T3).
- Cap landing on an empty column vanishes with 0 points (T6).
- Hatch with 0 enclosed monsters is tier 1, +50 (T7).
- Hatch with 6 enclosed monsters on a 7-high column is tier 4, +500, and is not game over (T10).
- Objects below the bound base half survive the hatch untouched (T11).
- A matching monster buried under another object is unreachable until uncovered (spec §8 notes).
- Monster landing on a 7-high column with a different top → game over (T19); with the same top → pair clears, no game over (T20).
- A buried identical monster lower in the stack never matches; only the top is compared (spec §8).
