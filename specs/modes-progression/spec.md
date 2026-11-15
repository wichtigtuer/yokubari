# Modes & Progression — Spec

## Goal

Implement both play modes and their progression rules. Endless mode counts fallen objects, levels up every 40, dips then re-ramps fall speed, and closes each level with a three-object batch. Stage-clear mode starts from a solvable pre-filled field (level 1–5 → 1–5 starting rows), is cleared by emptying the field, and awards a stage bonus from the editable table. Includes the additive score/hatch aggregation and the adaptive supply that keeps stage boards finishable. Covers spec §11, §12.1, §12.2 and acceptance tests T17, T18.

## User-visible behaviour

- Endless: after every 40 resolved objects the level rises, fall speed momentarily drops, then climbs again; play ends only on overflow.
- Stage-clear: the field starts pre-filled; clearing every object ends the stage, awards the table bonus, and starts the next stage with more objects.
- Score only ever increases by the amounts in spec §11; no combos, multipliers, or chains.

## Out of scope

- Menu screens and phase transitions (state-machine feature).
- The optional post-game bonus round (extensions feature).
- Versus (own feature), including per-side handicaps.
- Music (presentation only, extensions feature).

## Open questions (resolved)

- _"Fallen" means spawned or landed [U]:_ resolved per spec §12.1 suggestion — counted when an object lands or resolves.
- _Level cap above 5 [U]:_ resolved — no cap; the fall-interval table clamps its lookup at its last entry and the ramp keeps shortening intervals to a configured floor.
- _Pre-fill arrangement [U]:_ resolved by construction — each column gets vertical runs of an even count of one monster kind, so feeding matching monsters always clears it; no two vertically adjacent different kinds are required, runs guarantee no accidental matches at start.
- _Adaptive supply mechanism [M/D]:_ resolved — when the remaining object count is at or below a configured threshold, the generator draws only from kinds present on stack tops (or base/cap as needed), guaranteeing finishability.
- _Stage-bonus ceiling conflict (800 vs 1500):_ resolved — the full table including unconfirmed rows ships as editable config data, per spec §18.

## Edge cases

- A level-up batch of exactly 3 objects replaces the ordinary 2-object batch once, at the level transition.
- Overflow during stage-clear still loses the game (spec §12.2).
- Stage clear requires the field empty and no falling or pending objects (spec §14 step 9).
- Stage-clear bonus uses the stage number that was just cleared, not the next one.
- `fallenCount` keeps counting across level-ups; it is not reset.
- The ramp counter is separate from score and matches, per spec §12.1 [L].
