# Input & Tray Swap — Design

## Layer assignment

| Module               | Layer | Responsibility                                        |
| -------------------- | ----- | ----------------------------------------------------- |
| `src/game/cursor.ts` | core  | clamped cursor movement over the three adjacent pairs |
| `src/game/swap.ts`   | core  | stack exchange + falling-object carry rule            |

Depends on `specs/foundations/` (types, config, Result) and `src/game/board.ts` (`heightOf`) from `specs/board-mechanics/`.

## Data flow

```
Left/Right ──► cursor.ts: moveCursor(cursor, direction) → 0|1|2 (clamped)
Swap press ──► swap.ts: swapTrays(board, pairIndex, config)
                 ├─ columns[x] ↔ columns[x+1]  (order preserved)
                 └─ for each falling object in x or x+1:
                      max(height[x], height[x+1]) >= y  →  carry to the other column
                      otherwise                          →  keep column
```

## Public API surface

```ts
// src/game/cursor.ts
type CursorPair = 0 | 1 | 2;
function moveCursorLeft(cursor: CursorPair): CursorPair;
function moveCursorRight(cursor: CursorPair): CursorPair;

// src/game/swap.ts
type SwapResult = Readonly<{ board: BoardState; carried: ReadonlyArray<ObjectId> }>;
function swapTrays(board: BoardState, pairIndex: CursorPair, config: GameConfig): SwapResult;
```

`carried` lists the ids of falling objects that changed column so the shell can animate them without diffing state. Non-adjacent pairs are unrepresentable: `CursorPair` only names adjacent pairs, making T14 impossible by construction (Illegal States Unrepresentable).

## Tradeoffs

- **Unrepresentable non-adjacent pairs vs runtime validation:** chosen the `CursorPair` type — T14 ("cannot swap 0 and 2") is enforced by the compiler instead of a runtime check. Alternative rejected: accepting two column indices and returning `Result.error` moves a static guarantee into runtime code for no benefit.
- **Carry decision inside `swapTrays` vs a separate pass:** chosen inside — the rule reads pre-swap heights, and splitting it invites callers to swap columns without applying the carry rule. One function owns the whole spec §6 effect. Alternative rejected: a composable `carryFalling` helper is premature (O-7) until a second caller exists.
- **Heights read pre-swap vs post-swap:** pre-swap — the rule describes the stacks "sliding past" the object, so the deciding heights are those at the moment of the swap. Heights are unchanged by the exchange anyway (both columns keep their heights), so this is a clarity choice, not a behavioural one.

## Reuse map

- `src/contracts/types.ts` — `BoardState`, `FallingObject`, `CursorPair`-compatible column types.
- `src/contracts/config.ts` — `swapCarryOperator` kept as data so the `[U]` operator stays tunable.
- `src/game/board.ts` — `heightOf` (specs/board-mechanics).
