# Spawning & Gravity — Design

## Layer assignment

| Module                | Layer | Responsibility                                                                  |
| --------------------- | ----- | ------------------------------------------------------------------------------- |
| `src/game/spawn.ts`   | core  | batch generation from RNG + config                                              |
| `src/game/gravity.ts` | core  | fall interval computation and per-object step advance                           |
| `src/game/tick.ts`    | core  | one-board tick pipeline in spec §14 order (steps 3–7; later features extend it) |

Depends on `specs/foundations/` (types, config, RNG, Result) and `specs/board-mechanics/` (`landObject`).

## Data flow

```
spawn.ts ──► Batch { objects: [{ kind, column, spawnDelay }] }
                 │ tick when delay elapsed
                 ▼
gravity.ts ──► fallInterval(speedMode, level, rampCounter, softDrop, config)
             ──► stepObject(obj) → y decreases by 1/stepsPerCell per interval
                 │ y <= heightOf(column)
                 ▼
tick.ts ──► landObject(column, kind) → board + score events + gameOver flag
                 │
                 ▼
        spawn next batch when `falling` is empty
```

## Public API surface

```ts
// src/game/spawn.ts
type SpawnedObject = Readonly<{ kind: Falling; column: ColumnIndex; spawnDelay: number }>;
type Batch = Readonly<{ objects: ReadonlyArray<SpawnedObject> }>;
function generateBatch(rng: Rng, config: GameConfig, size: number): Result<Batch, SpawnError>;
type SpawnError = { reason: 'invalid-size' } | { reason: 'type-weights' };

// src/game/gravity.ts
type FallContext = Readonly<{ speedMode: 'low' | 'high'; level: number; rampCounter: number; softDrop: boolean }>;
function fallIntervalTicks(context: FallContext, config: GameConfig): number;
function stepFalling(object: FallingObject, config: GameConfig): FallingObject; // y -= 1/stepsPerCell
function hasLanded(object: FallingObject, columnHeight: number): boolean; // y <= height

// src/game/tick.ts
type TickEvent =
    | Readonly<{ type: 'scored'; points: number }>
    | Readonly<{ type: 'hatched'; enclosed: number; tier: HatchTier; points: number }>
    | Readonly<{ type: 'game-over' }>
    | Readonly<{ type: 'batch-spawned'; batch: Batch }>;
type TickResult = Readonly<{ board: BoardState; events: ReadonlyArray<TickEvent>; landedCount: number }>;
function tickBoard(board: BoardState, context: FallContext, rng: Rng, config: GameConfig): TickResult;
```

`tickBoard` implements spec §14 steps 3–7 and 10 for a single board: advance due objects, resolve each landing immediately, emit events, and spawn the next batch when the field has no falling objects left. Input (steps 1–2) and progression (step 8) are applied by later features around this function.

## Tradeoffs

- **Tick-based intervals vs continuous dt integration:** chosen tick-based — spec §7 says objects fall in discrete steps, and a fixed tick keeps the simulation lock-step deterministic for versus and replay. Alternative rejected: dt integration introduces float drift across engines, which the E2E snapshot strategy explicitly avoids.
- **Generator returns plain kinds+columns vs pre-built `FallingObject`s:** chosen plain data with `spawnDelay` — object ids are assigned when the object actually enters the field, keeping `FallingObject` creation in one place (`tickBoard`). Alternative rejected: early id assignment couples spawn order to entry order and complicates staggering.
- **Distinct columns enforced by resampling vs shuffle:** chosen sampling without replacement from `[0,1,2,3]` — simple, seed-deterministic. Alternative rejected: rejection loops can be unbounded in principle and obscure in tests.

## Reuse map

- `src/utils/random.ts` — `Rng`, `nextInt`, `weightedChoice`.
- `src/contracts/config.ts` — batch size, delays, interval table, `stepsPerCell`, `softDropMultiplier`.
- `src/game/overflow.ts` — `landObject` for contact resolution (specs/board-mechanics).
- `src/game/board.ts` — `heightOf` for landing detection.
