# Board Mechanics — Design

## Layer assignment

| Module                 | Layer       | Responsibility                                                       |
| ---------------------- | ----------- | -------------------------------------------------------------------- |
| `src/game/board.ts`    | core (pure) | stack queries: `heightOf`, `topOf`, immutably updated columns        |
| `src/game/resolve.ts`  | core        | landing resolution for monster and base-half objects (spec §8 table) |
| `src/game/egg.ts`      | core        | cap-half binding, egg completion, tier lookup (spec §9)              |
| `src/game/overflow.ts` | core        | overflow predicate and landing+overflow orchestration (spec §10)     |

Depends only on `src/contracts/` and `src/utils/` from `specs/foundations/`.

## Data flow

```
falling object + column
        │
        ▼
resolve.ts ── monster/base ──► LandingOutcome (stacked | pair-cleared)
        │
        ▼ cap
egg.ts ──► bind topmost base ──► LandingOutcome (cap-vanished | hatched N, tier, points)
        │
        ▼
overflow.ts ──► would height exceed 7 after resolution? ──► 'game-over' flag on outcome
```

## Public API surface

```ts
// src/game/board.ts
function heightOf(column: ReadonlyArray<StackItem>): number;
function topOf(column: ReadonlyArray<StackItem>): Option<StackItem>;
function pushItem(column: ReadonlyArray<StackItem>, item: StackItem): StackItem[];
function dropTop(column: ReadonlyArray<StackItem>): StackItem[];

// src/game/resolve.ts
type LandingOutcome =
    | Readonly<{ type: 'stacked'; column: StackItem[] }>
    | Readonly<{ type: 'pair-cleared'; column: StackItem[]; points: number }>
    | Readonly<{ type: 'cap-vanished' }>
    | Readonly<{ type: 'hatched'; column: StackItem[]; enclosed: number; tier: HatchTier; points: number }>;
function resolveLanding(column: ReadonlyArray<StackItem>, incoming: Falling, config: GameConfig): LandingOutcome;

// src/game/egg.ts
function findTopmostBaseIndex(column: ReadonlyArray<StackItem>): Option<number>;
function hatchTierFor(enclosed: number, config: GameConfig): Result<HatchTier, HatchTierError>;

// src/game/overflow.ts
function causesOverflow(column: ReadonlyArray<StackItem>, outcome: LandingOutcome, config: GameConfig): boolean;
type LandedResult = Readonly<{ outcome: LandingOutcome; gameOver: boolean }>;
function landObject(column: ReadonlyArray<StackItem>, incoming: Falling, config: GameConfig): LandedResult;
```

`landObject` is the single entry point; `resolveLanding` and `causesOverflow` stay exported for unit tests but shell code only calls `landObject`.

## Tradeoffs

- **Single discriminated-union outcome vs separate boolean returns:** chosen the ADT — Illegal States Unrepresentable; a `hatched` outcome always carries `enclosed` and `points`, so versus attacks (later) can read N without re-scanning the column. Alternative rejected: returning `{ column, points, enclosed? }` makes the no-hatch case representable with a spurious `enclosed`.
- **Immutable column copies vs in-place mutation:** chosen immutable (`pushItem`/`dropTop` return new arrays) — Data-First design, trivially testable, and later swap/tick code never worries about aliasing. Alternative rejected: mutation is faster but columns hold ≤ 7 items, so copying is negligible.
- **Cap binding implemented in `egg.ts` rather than inline in `resolve.ts`:** chosen separation — binding, run-removal and tier lookup are one responsibility (O-6/O-12) and are unit-testable without the monster/base branch.

## Reuse map

- `src/contracts/types.ts` — `StackItem`, `Falling`, `Monster`.
- `src/contracts/config.ts` — `GAME_CONFIG` (scores, tier table, capacity).
- `src/utils/result.ts` — `Option`, `Result`, `some`/`none`.
