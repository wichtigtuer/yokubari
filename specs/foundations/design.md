# Foundations — Design

## Layer assignment

| Module                    | Layer                   | Responsibility                                           |
| ------------------------- | ----------------------- | -------------------------------------------------------- |
| `src/utils/result.ts`     | utils (domain-agnostic) | `Result<T,E>`, `Option<T>`, constructors and combinators |
| `src/utils/pipe.ts`       | utils                   | left-to-right function composition                       |
| `src/utils/brand.ts`      | utils                   | `Brand<K, T>` branded-type helper                        |
| `src/utils/random.ts`     | utils                   | seedable RNG factory + weighted choice                   |
| `src/contracts/types.ts`  | contracts               | domain vocabulary from spec §15                          |
| `src/contracts/config.ts` | contracts               | every `[U]` parameter from spec §17 as typed data        |

Contracts and utils depend on nothing in this project; every later feature depends on them (Stable Dependencies Principle).

## Public API surface

```ts
// src/utils/result.ts
type Result<T, E> = { type: 'ok'; value: T } | { type: 'error'; error: E };
type Option<T> = { type: 'some'; value: T } | { type: 'none' };
function ok<T>(value: T): Result<T, never>;
function err<E>(error: E): Result<never, E>;
function some<T>(value: T): Option<T>;
function none(): Option<never>;
function mapResult<T, U, E>(fn: (value: T) => U): (result: Result<T, E>) => Result<U, E>;
function flatMapResult<T, U, E>(fn: (value: T) => Result<U, E>): (result: Result<T, E>) => Result<U, E>;

// src/utils/pipe.ts
function pipe<A>(a: A): A;
function pipe<A, B>(a: A, ab: (a: A) => B): B;
// …overloads up to 6 stages, matching real usage

// src/utils/brand.ts
type Brand<K, T> = K & { readonly __brand: T };

// src/utils/random.ts
type Rng = () => number; // [0, 1)
function createRng(seed: number): Rng;
function nextInt(rng: Rng, count: number): number; // 0..count-1
function weightedChoice<T>(rng: Rng, entries: ReadonlyArray<readonly [T, number]>): Result<T, WeightedChoiceError>;
type WeightedChoiceError = { reason: 'empty' } | { reason: 'no-positive-weight' };

// src/contracts/types.ts
type Monster = 'm0' | 'm1' | 'm2' | 'm3';
type StackItem = Monster | 'base';
type Falling = Monster | 'base' | 'cap';
type ColumnIndex = 0 | 1 | 2 | 3;
type ObjectId = Brand<number, 'ObjectId'>;
type FallingObject = Readonly<{ id: ObjectId; kind: Falling; column: ColumnIndex; y: number }>;
type Phase =
    | 'title'
    | 'menu'
    | 'ready'
    | 'playing'
    | 'paused'
    | 'stage-clear'
    | 'game-over'
    | 'round-result'
    | 'match-result';
type BoardState = Readonly<{ columns: ReadonlyArray<ReadonlyArray<StackItem>>; falling: ReadonlyArray<FallingObject> }>;
type GameState = Readonly<{/* spec §15 fields, all Readonly */}>;
```

```ts
// src/contracts/config.ts — every value from spec §17
const GAME_CONFIG = {
    columns: 4,
    stackCapacity: 7,
    monsterPairScore: 5,
    basePairScore: 5,
    capNoBaseScore: 0,
    hatchTiers: [
        { maxEnclosed: 0, tier: 1, points: 50 },
        { maxEnclosed: 3, tier: 2, points: 100 },
        { maxEnclosed: 5, tier: 3, points: 200 },
        { maxEnclosed: 6, tier: 4, points: 500 }
    ],
    levelUpEvery: 40,
    menuLevels: [1, 5],
    batchSize: 2,
    levelUpBatchSize: 3,
    versusTokensToWin: 3,
    stepsPerCell: 4, // [U] placeholder, tune by feel
    fallIntervals: {/* per speedMode × level, in ticks */}, // [U] placeholder table
    softDropMultiplier: 4, // [U] placeholder
    typeWeights: [/* uniform over 6 types — placeholder */],
    swapCarryOperator: '>=' as const
} satisfies GameConfig;
```

## Tradeoffs

- **Hand-rolled Result vs library (neverthrow, ts-results):** chosen hand-rolled — ~40 lines, zero dependencies, matches the exact shape AGENTS.md mandates. Alternative rejected: a dependency for two type aliases violates KISS.
- **mulberry32 vs xorshift128+:** chosen mulberry32 — trivial to implement and audit. Alternative rejected: longer-period generators buy nothing for puzzle spawning and complicate review.
- **Config as typed `const` vs JSON in `public/`:** chosen typed const — compile-time checking of every tunable and tree-shakeable; tuning is a developer action, not a runtime action. Alternative rejected: runtime JSON adds a load path and validation for no current need.

## Reuse map

Nothing to reuse — these are the first modules. Later features reuse these by path.
