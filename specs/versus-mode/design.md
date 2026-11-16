# Versus Mode — Design

## Layer assignment

| Module               | Layer | Responsibility                                            |
| -------------------- | ----- | --------------------------------------------------------- |
| `src/game/versus.ts` | core  | dual-board state, lock-step tick, attacks, tokens, rounds |

Depends on `specs/spawning-gravity/` (`tickBoard`), `specs/board-mechanics/` (hatch `enclosed` counts), `specs/modes-progression/` (`isStageCleared`), and `specs/game-phases/` (consumes `round-decided` / `match-decided` via emitted events).

## Data flow

```
                 ┌──────────── left board ────────────┐
tickVersus ──────┤  tickBoard → events (hatched N)     │──► enqueue N attacks → right.pendingAttack
                 └──────────── right board ───────────┘◄── enqueue N attacks ← left hatches
                 │
                 ▼ round adjudication (after both sides tick)
   both cleared → token each · both overflowed → draw, restart
   one cleared → token · one overflowed → opponent token
                 │
                 ▼ tokens reach 3 → 'match-decided' event
```

## Public API surface

```ts
// src/game/versus.ts
type Side = 'left' | 'right';
type SideState = Readonly<{
    board: BoardState;
    progression: Progression;
    score: ScoreState;
    pendingAttack: ReadonlyArray<Falling>;
}>;
type VersusState = Readonly<{
    left: SideState;
    right: SideState;
    tokens: Readonly<{ left: number; right: number }>;
    round: number;
}>;
type VersusEvent =
    | Readonly<{ type: 'attack-sent'; from: Side; count: number }>
    | Readonly<{ type: 'round-decided'; outcome: RoundOutcome }>
    | Readonly<{ type: 'match-decided'; winner: Side }>;
type RoundOutcome =
    | Readonly<{ type: 'cleared'; side: Side }>
    | Readonly<{ type: 'overflow'; side: Side }>
    | Readonly<{ type: 'both-cleared' }>
    | Readonly<{ type: 'draw-overflow' }>;
function tickVersus(
    state: VersusState,
    inputs: Readonly<Record<Side, SideInput>>,
    rngs: Record<Side, Rng>,
    config: GameConfig
): Readonly<{ state: VersusState; events: ReadonlyArray<VersusEvent> }>;
function startRound(state: VersusState, rng: Rng, config: GameConfig): VersusState;
```

Each side owns its RNG stream; attacks are composed at enqueue time (kinds + columns drawn from the _receiving_ side's RNG so replaying one side reproduces its field exactly). `tickVersus` ticks both boards with identical dt, then adjudicates the round — order is fixed and documented, keeping the simulation lock-step deterministic (spec §12.3).

## Tradeoffs

- **Attacks merged into the next batch vs a separate attack wave:** chosen merge — one spawn path, one stagger rule, no second falling-object source to keep consistent. Alternative rejected: a dedicated wave duplicates entry/stagger logic and complicates "field empty" detection (O-10).
- **Draw = restart round vs draw = both tokens:** chosen restart for double-overflow (nothing was achieved), both-tokens for double-clear (both achieved the goal) — asymmetric but each outcome rewards demonstrated progress. Alternative rejected: uniform handling either cheapens clears or double-punishes overflows; flagged as `[U]` in the spec so the choice lives in config-adjacent code, documented in spec.md.
- **`Record<Side, …>` vs tuple `[left, right]`:** chosen `Record` — side-keyed access reads better than index arithmetic and cannot transpose the boards accidentally. Alternative rejected: tuples are terser but error-prone at every call site.

## Reuse map

- `src/game/tick.ts` — `tickBoard`, `TickEvent` (`hatched` carries `enclosed`) (specs/spawning-gravity).
- `src/game/stage.ts` — `isStageCleared` for round-win detection (specs/modes-progression).
- `src/game/progression.ts`, `src/game/score.ts` — per-side state records (specs/modes-progression).
- `src/game/phases.ts` — consumes `round-decided`/`match-decided` (specs/game-phases).
- `src/utils/random.ts` — per-side RNG streams.
- `src/contracts/config.ts` — `versusTokensToWin`, attack composition rules.
