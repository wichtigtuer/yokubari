# Stack-Routing Puzzle — Implementation Plan

Ordered implementation list derived from the mechanics specification. Built bottom-up so each increment only depends on what is already done. Items 1–22 are a pure domain core (no engine dependency — fast unit tests); the PlayCanvas shell comes last, per the project's Functional Core / Imperative Shell principle. SDTE artifacts for each phase live in the matching folder under `/specs/` (see `/specs/README.md`).

## Phase 0 — Foundations → `specs/foundations/`

| #   | Item                                                                                                                                                                 | Verifies / Spec refs                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 1   | `src/utils/result.ts` — `Result<T,E>`, `Option<T>` + `pipe()` utility                                                                                                | Exception-free rule; reused everywhere           |
| 2   | `src/contracts/types.ts` — `Monster`, `StackItem`, `Falling`, `FallingObject`, `GameState`, `Phase`, branded `ObjectId`; constants `COLUMNS=4`, `STACK_CAPACITY=7`   | §2, §15                                          |
| 3   | `src/contracts/config.ts` — all [U] parameters as data: batch sizes, stagger, tier table, stage-bonus table, speed table, soft-drop multiplier, distribution weights | §17 — placeholders editable, never hardcoded     |
| 4   | Seeded RNG factory (`(seed) => () => number`)                                                                                                                        | §4 — seedable/replaceable for reproducible tests |

## Phase 1 — Board mechanics (pure functions over `StackItem[][]`) → `specs/board-mechanics/`

| #   | Item                                                                                                                                                           | Verifies / Spec refs |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 5   | Stack queries/commands: `height`, `topOf`, `push`, `removeTop` (vertical-only, order-preserving)                                                               | §2                   |
| 6   | Landing resolution: monster-vs-monster match (+5), base-vs-base match (+5), otherwise stack                                                                    | T1–T5; §8            |
| 7   | Egg completion: cap binds topmost base half, removes enclosed run, tier lookup (0→50 / 1–3→100 / 4–5→200 / 6→500), hatch counter, objects below base untouched | T6–T12; §9           |
| 8   | Overflow check, resolve-before-overflow ordering, cap-on-full-column exception                                                                                 | T10, T19, T20; §10   |

## Phase 2 — Spawning & gravity → `specs/spawning-gravity/`

| #   | Item                                                                                                         | Verifies / Spec refs |
| --- | ------------------------------------------------------------------------------------------------------------ | -------------------- |
| 9   | Batch generator: seeded, weighted type distribution (default uniform), 2 objects, distinct staggered columns | §4                   |
| 10  | Gravity accumulator: discrete steps, speed = f(speedMode, level, rampCounter, softDrop)                      | T15; §7              |
| 11  | Full landing pipeline (tick steps 3–7 of §14): fall → resolve → score/hatch → overflow                       | §14                  |

## Phase 3 — Input & tray swap → `specs/input-swap/`

| #   | Item                                                                                  | Verifies / Spec refs |
| --- | ------------------------------------------------------------------------------------- | -------------------- |
| 12  | Cursor model: Left/Right clamped over pairs (0,1)/(1,2)/(2,3), one swap per press     | §5                   |
| 13  | Tray swap: whole stacks exchange, order preserved, empty↔full allowed, only adjacent  | T13, T14; §6         |
| 14  | Falling-object carry rule: carried iff `max(height[x], height[x+1]) >= y`, else stays | T21, T22; §6         |

## Phase 4 — Progression & modes → `specs/modes-progression/`

| #   | Item                                                                                                                   | Verifies / Spec refs  |
| --- | ---------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 15  | Endless progression: `fallenCount`, level-up every 40, speed dip-then-ramp, 3-object level-end batch                   | T17; §12.1            |
| 16  | Stage-clear mode: pre-fill generator (level→rows, no adjacent identical, solvable), clear detection, stage bonus table | T18; §12.2            |
| 17  | Adaptive supply for stage-clear (generator supplies icons needed when few remain)                                      | §4 [M/D] — own design |
| 18  | Score/hatch aggregation (additive only, no combos)                                                                     | §11                   |

## Phase 5 — Game state machine → `specs/game-phases/`

| #   | Item                                                                                                           | Verifies / Spec refs |
| --- | -------------------------------------------------------------------------------------------------------------- | -------------------- |
| 19  | Phase machine: title → menu → ready → playing ⇄ paused → stage-clear/game-over; pause freezes gravity + queues | T16; §13             |
| 20  | Menu parameters (mode A/B, level 1–5, speed LOW/HIGH, music)                                                   | §12.0                |

## Phase 6 — Versus (two independent boards) → `specs/versus-mode/`

| #   | Item                                                                                                   | Verifies / Spec refs |
| --- | ------------------------------------------------------------------------------------------------------ | -------------------- |
| 21  | Versus state: two `GameState`s + tokens, round win (clear first) / loss (overflow), match at 3 tokens  | T24–T26; §12.3       |
| 22  | Attack queue: egg enclosing N monsters injects N extra falling objects on opponent's side (N=0 → none) | T23; §12.3           |

## Phase 7 — Shell (PlayCanvas presentation) → `specs/presentation-shell/`

| #   | Item                                                                                                           | Verifies / Spec refs                        |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 23  | Scene: 4 trays + stack entities driven from state; falling-object visuals; swap animation (length from config) | use `assemble-scene`, `build-app` skills    |
| 24  | Input wiring: keyboard → domain actions (Left/Right/Swap/Down/Start)                                           | §5                                          |
| 25  | HUD + title/menu/stage-clear/game-over screens (score, level, hatched, tokens)                                 | §13                                         |
| 26  | Test API (`__pcTestApi`) + E2E suite: state-first tests, replay fixtures, full T1–T26 acceptance matrix        | use `e2e-tests` skill; T-4 state-first rule |

## Phase 8 — Optional extensions → `specs/optional-extensions/`

| #   | Item                                                         | Verifies / Spec refs |
| --- | ------------------------------------------------------------ | -------------------- |
| 27  | Bonus round (endless, ≥10 hatched) — details [U], own design | §12.1                |
| 28  | Music hooks (3 tracks + off, presentation only)              | §12.0                |

## Notes

- **Dependency chain is strictly linear through Phase 6**: 5→6→7→8 (resolution builds on stacks), 9→10→11, 12→13→14, then 11+14→15, 15→16–18, →19→20, →21→22. Phases 7–8 depend on everything but items within them can parallelize.
- Each item follows C-1 TDD: stub → failing test → implement; gates G-1–G-5 after every increment, G-6 (`pnpm run ok`) at phase boundaries.
