# Game Phases — Design

## Layer assignment

| Module               | Layer | Responsibility                                   |
| -------------------- | ----- | ------------------------------------------------ |
| `src/game/phases.ts` | core  | phase transition function over the `Phase` union |
| `src/game/menu.ts`   | core  | menu parameter model and field editing           |

Depends on `specs/foundations/` (`Phase` type, config, Result) and the event vocabulary of earlier features (`game-over`, stage cleared).

## Data flow

```
domain/input events ──► transition(app, event) ──► Result<App, TransitionError>
                          │
   title ──choose players──► menu ──confirm──► ready ──► playing ⇄ paused (Start)
   playing ──game-over──► game-over
   playing ──stage cleared──► stage-clear ──► ready (next stage)
   playing ──round decided (versus)──► round-result ──► ready | match-result
```

## Public API surface

```ts
// src/game/menu.ts
type MenuParams = Readonly<{ mode: 'A' | 'B'; level: number; speed: 'low' | 'high'; music: 'off' | 0 | 1 | 2 }>;
type MenuField = 'mode' | 'level' | 'speed' | 'music';
function adjustMenuField(params: MenuParams, field: MenuField, direction: -1 | 1, config: GameConfig): MenuParams;

// src/game/phases.ts
type AppEvent =
    | Readonly<{ type: 'choose-players'; count: 1 | 2 }>
    | Readonly<{ type: 'confirm-menu' }>
    | Readonly<{ type: 'start-pressed' }> // context-dependent: start / pause / resume
    | Readonly<{ type: 'game-over' }>
    | Readonly<{ type: 'stage-cleared' }>
    | Readonly<{ type: 'round-decided' }> // versus feature supplies this
    | Readonly<{ type: 'match-decided' }>
    | Readonly<{ type: 'advance' }>; // leave ready / stage-clear / round-result
type App = Readonly<{ phase: Phase; players: 1 | 2; menus: ReadonlyArray<MenuParams> }>;
type TransitionError = { reason: 'illegal-transition'; from: Phase; event: AppEvent['type'] };
function transition(app: App, event: AppEvent): Result<App, TransitionError>;
```

`start-pressed` is one event interpreted by phase — playing → paused, paused → playing, everything else → `Result.error` or no-op per the table in `phases.ts`. Illegal transitions return a typed error; the shell logs and ignores them (no silent failure, no throw).

## Tradeoffs

- **Single `transition` function vs per-phase handler map:** chosen one pure function with an explicit event union — the whole legal-transition table is readable in one file, and tests enumerate it exhaustively. Alternative rejected: a handler registry is more "extensible" but hides the graph and invites unregistered-event bugs (O-8).
- **Pause as a distinct phase vs a boolean flag:** chosen the spec's own `Phase` vocabulary — `paused` is a phase; the tick loop simply does not run in it, making the freeze total by construction. Alternative rejected: a `paused: boolean` alongside `playing` allows drifting states (paused-but-ticking).
- **`start-pressed` overloaded by phase vs separate pause/resume events:** chosen overload — it mirrors the hardware (one Start button, spec §5) and keeps shell input mapping trivial. The ambiguity is resolved inside the machine, where the phase is known.

## Reuse map

- `src/contracts/types.ts` — `Phase` union (specs/foundations).
- `src/contracts/config.ts` — menu ranges (`menuLevels`), music track count.
- `src/utils/result.ts` — `Result` for illegal transitions.
- Event producers: `src/game/tick.ts` (`game-over`), `src/game/stage.ts` (`isStageCleared`), versus feature (`round-decided`).
