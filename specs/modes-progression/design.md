# Modes & Progression — Design

## Layer assignment

| Module                    | Layer | Responsibility                                                        |
| ------------------------- | ----- | --------------------------------------------------------------------- |
| `src/game/progression.ts` | core  | fallen counting, level-up detection, ramp reset (endless)             |
| `src/game/stage.ts`       | core  | prefill generation, clear detection, stage bonus lookup (stage-clear) |
| `src/game/supply.ts`      | core  | adaptive type supply for nearly-finished stage boards                 |
| `src/game/score.ts`       | core  | additive score + hatched counter application from tick events         |

Depends on `specs/foundations/`, `specs/board-mechanics/`, and `specs/spawning-gravity/` (`tickBoard` events, `generateBatch`).

## Data flow

```
endless:  tick events ──► progression.registerFallen(count)
                            │ fallenCount crosses multiple of 40
                            ▼ level+1, rampCounter=0 (dip), next batch size 3
          next tick ──► gravity reads new level → interval re-ramps upward

stage:    stage number ──► stage.generatePrefill(rng, level) → starting columns
          tick events ──► stage.isStageCleared(board) → bonus lookup → next stage
          supply.adaptWeights(board, config) → weights fed to generateBatch
```

## Public API surface

```ts
// src/game/progression.ts
type Progression = Readonly<{ level: number; fallenCount: number; rampCounter: number; pendingBatchSize: number }>;
function registerFallen(progression: Progression, landedCount: number, config: GameConfig): Progression;
function advanceRamp(progression: Progression, config: GameConfig): Progression; // per tick

// src/game/stage.ts
function generatePrefill(rng: Rng, level: number, config: GameConfig): ReadonlyArray<StackItem[]>;
function isStageCleared(board: BoardState): boolean;
function stageBonus(stageNumber: number, config: GameConfig): number;

// src/game/supply.ts
function adaptWeights(board: BoardState, config: GameConfig): ReadonlyArray<readonly [Falling, number]>;

// src/game/score.ts
type ScoreState = Readonly<{ score: number; hatched: number }>;
function applyTickEvents(scoreState: ScoreState, events: ReadonlyArray<TickEvent>): ScoreState;
```

`generatePrefill` builds even-length vertical runs of one monster kind per run — solvable by construction (feed the matching kind, pairs annihilate from the top down), with run kinds drawn from the seeded RNG. `adaptWeights` reads stack tops: when `totalObjects(board) <= adaptThreshold`, weights cover only kinds that can clear exposed tops (matching monster for monster tops; `base` for base tops; `cap` when a base sits under monsters), falling back to uniform otherwise.

## Tradeoffs

- **Prefill by construction vs generate-and-verify solver:** chosen by construction — deterministic, cheap, and provably finishable without writing a solver. Alternative rejected: a backtracking solvability check is a large, flaky dependency for a guarantee obtainable structurally.
- **Adaptive supply as weight transformation vs a separate generator:** chosen weight transformation — one generator path (`generateBatch`) stays the only spawn entry point; adaptivity is just different weights. Alternative rejected: a second generator duplicates column/stagger logic (DRY, O-9).
- **Progression as its own `Progression` record vs fields on `GameState`:** chosen a nested record on `GameState` — level/fallen/ramp evolve together and travel as one immutable unit; `GameState` shape still matches spec §15. Alternative rejected: scattering the three fields invites updating one without the others.

## Reuse map

- `src/game/tick.ts` — `TickEvent` stream consumed by `score.ts` and `progression.ts` (specs/spawning-gravity).
- `src/game/spawn.ts` — `generateBatch`, the single spawn path (specs/spawning-gravity).
- `src/game/board.ts` — `heightOf`, `topOf` for `adaptWeights` (specs/board-mechanics).
- `src/contracts/config.ts` — level table, bonus table, thresholds.
- `src/utils/random.ts` — seeded RNG for prefill.
