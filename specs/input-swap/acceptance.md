# Input & Tray Swap — Acceptance

## Cursor (spec §5)

- Cursor 0 + Left → 0; cursor 2 + Right → 2 (clamped, no wrap).
- Cursor 1 + Left → 0; cursor 1 + Right → 2.

## Stack exchange

- T13: columns `['m0','m1']` and `['m2']` under pair (1,2) exchange; both keep internal order and height; columns 0 and 3 untouched.
- T14: the API cannot express swapping columns 0 and 2 — `swapTrays` accepts only `0 | 1 | 2` pair indices (compile-time proof plus a type-level test).
- Empty column swapped with a full one exchanges emptiness; no error.

## Carry rule (spec §6)

- T21: object at y = 5 above swapped columns of heights 2 and 3 → stays in its column; `carried` is empty.
- T22: same object at y = 3 with heights 2 and 3 → carried to the other column; its id appears in `carried`.
- Boundary: y exactly equal to `max(height)` → carried (`>=` operator from config).
- Objects in columns outside the swapped pair are never carried.
- Falling objects land on whichever stack occupies their column after the swap (spec §6) — verified through `tickBoard` integration.
