# Presentation Shell — Design

## Layer assignment

| Module                                 | Layer            | Responsibility                                                     |
| -------------------------------------- | ---------------- | ------------------------------------------------------------------ |
| `index.html`                           | shell            | scene: camera, light, 4 tray entities, HUD roots                   |
| `src/main.ts`                          | shell            | bootstrap, frame loop, wires input → core → render                 |
| `src/render/board-view.ts`             | shell            | sync entities/materials from `BoardState` (render-only, no rules)  |
| `src/render/swap-animation.ts`         | shell            | tween trays + carried objects over configured ticks                |
| `src/input.ts`                         | shell            | keyboard → domain events, repeat filtering                         |
| `src/hud.ts`                           | shell            | score/level/hatched/tokens DOM overlay                             |
| `src/test-api.ts`                      | shell (dev-only) | extend `__pcTestApi`: state snapshot, scripted input, `stepFrames` |
| `e2e/stack-routing.spec.ts` + fixtures | e2e              | T1–T26 state-first suite                                           |

## Data flow

```
keyboard ──► input.ts ──► domain events ──► core (swap/tick/phases/versus)
                                               │ new immutable state + events
                                               ▼
                              board-view.ts + swap-animation.ts + hud.ts  (read-only render)
frame loop: fixed accumulator → core tick(s) in 'playing' → render every rAF
```

The frame loop uses a fixed-timestep accumulator: simulation advances in core ticks (decoupled from rAF), rendering interpolates nothing — positions come from state. Test mode sets `timeScale = 0` and only `stepFrames` advances ticks, matching the existing E2E conventions.

## Public API surface (test API)

```ts
// src/test-api.ts (extends existing)
window.__pcTestApi = {
  getState(): GameStateSnapshot;          // clone, rounded floats
  dispatchInput(action: InputAction): void;
  stepFrames(n: number): void;
  freezeForSnapshot(): void;
  runReplay(fixture: ReplayFixture): Result<GameStateSnapshot, ReplayError>;
};
```

## Tradeoffs

- **Web-components entities vs imperative Engine scene graph:** chosen web-components — the project's declared architecture (AGENTS.md); state→entity sync is a pure read of `BoardState`. Alternative rejected: hand-managing `pc.Entity` trees bypasses the starter's conventions and the Inspector for no gain.
- **Instant model swap + visual tween vs animated model swap:** chosen instant model + tween — carry-rule tests stay in the deterministic core; animation length is presentation data (spec §6 [U]). Alternative rejected: animating the model would make landing timing depend on tween progress and break lock-step versus.
- **DOM HUD vs in-canvas text:** chosen DOM overlay — accessible, cheap, and screenshot-stable for the `@snapshot` tests. Alternative rejected: canvas text adds font assets and rendering variance.
- **Fixed-timestep accumulator vs rAF-dt:** chosen fixed — same determinism argument as the core tick; render-only frames never advance state (AGENTS.md E2E section).

## Reuse map

- `src/test-api.ts` — existing skeleton to extend.
- `e2e/base-fixtures.ts` — `gotoTestMode`, `stepFrames`, `dispatchInput`, `getState`, `freezeForSnapshot`, `runReplay`.
- `e2e/replay-fixture.ts` — `parseReplayFixture` for replay tests.
- `src/inspector.ts`, `vite.config.ts` — dev-only Inspector and istanbul instrumentation, unchanged.
- All `src/game/*` and `src/contracts/*` modules from earlier features.
