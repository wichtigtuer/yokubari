# Input & Tray Swap — Spec

## Goal

Implement the player's only verb: choosing a neighboring tray pair with a clamped cursor and swapping the two whole stacks. Includes the mid-fall carry rule that decides whether a falling object above the swapped trays is carried to the other column or stays put. Covers spec §5, §6 and acceptance tests T13, T14, T21, T22.

## User-visible behaviour

- Left/Right moves the cursor between pairs (0,1), (1,2), (2,3), clamped at both ends; no wrap-around.
- One Swap press performs exactly one swap; there is no auto-repeat.
- Swapping exchanges complete stacks, preserving internal order; empty ↔ full is allowed.
- A falling object in a swapped column is carried across when either stack reaches its altitude, otherwise it stays.

## Out of scope

- Physical key bindings and DOM event listeners (shell feature).
- Swap animation timing (shell reads the length from config; the swap itself is instant in the model).
- Any effect on score, overflow, or progression — a swap never resolves landings by itself.
- Versus-specific routing (each side applies this to its own board).

## Open questions (resolved)

- _Cursor wrap-around [U]:_ resolved per spec §5 suggestion — none; clamped.
- _Auto-repeat for held Swap [U]:_ resolved per spec §5 suggestion — one swap per press; key-repeat events are filtered by the shell later.
- _Carry comparison operator [U]:_ resolved per spec §17 — `>=` in cell units: carried iff `max(height[x], height[x+1]) >= y`.
- _Input locked during swap animation [U]:_ resolved — the model applies swaps instantly; the shell may debounce during its animation, a presentation concern.
- _Simultaneous swap + landing [U]:_ resolved per spec §14 tick order — swap applies before gravity each tick.

## Edge cases

- Cursor at pair 0: pressing Left keeps it at 0; symmetric for pair 2 and Right.
- Swapping a pair where one or both columns are empty is legal and exchanges emptiness (spec §6 [D]).
- An object exactly at `max(height[x], height[x+1])` altitude is carried (operator is `>=`).
- An object above both stacks stays in its column and later lands on whichever stack now occupies it (T21).
- Swaps do not disturb falling objects in the two untouched columns.
- Swap during pause is rejected by the caller (phase machine feature); the swap function itself is unconditional.
