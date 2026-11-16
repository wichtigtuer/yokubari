# Game Phases — Acceptance

## Menu (spec §12.0, §5)

- `level` clamps to 1..5; `speed` toggles low/high; `mode` toggles A/B; `music` cycles off → 0 → 1 → 2 → off.
- Editing one field leaves the others unchanged.

## Transitions (spec §13)

- title + `choose-players(2)` → menu with two menu states.
- menu + `confirm-menu` → ready; ready + `advance` → playing.
- T16: playing + `start-pressed` → paused; paused + `start-pressed` → playing; the board snapshot is identical before and after the round-trip.
- paused + `start-pressed` twice rapidly = pause then resume (no buffering surprises; each press is one event).
- playing + `stage-cleared` → stage-clear; stage-clear + `advance` → ready.
- playing + `game-over` → game-over.
- round-result + `advance` → ready when the match continues, → match-result after `match-decided`.
- `title + game-over`, `paused + confirm-menu`, `stage-clear + start-pressed` → `Result.error({ reason: 'illegal-transition', ... })`.
