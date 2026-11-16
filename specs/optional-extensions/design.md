# Optional Extensions — Design

## Layer assignment

| Module                     | Layer | Responsibility                                                      |
| -------------------------- | ----- | ------------------------------------------------------------------- |
| `src/game/bonus.ts`        | core  | bonus-round state: egg sequence, timing windows, reward computation |
| `src/audio.ts`             | shell | HTMLAudio playback driven by menu music value                       |
| `src/render/bonus-view.ts` | shell | minimal bonus-round scene/HUD                                       |

Depends on `specs/foundations/` (config, Result), `specs/game-phases/` (new `bonus-round` transition from `game-over`), and `specs/presentation-shell/` (screens, input).

## Public API surface

```ts
// src/game/bonus.ts
type BonusState = Readonly<{ eggIndex: 0 | 1 | 2 | 3; windowOpen: boolean; rewards: ReadonlyArray<number> }>;
function bonusEligible(hatched: number, config: GameConfig): boolean;
function pressBonus(state: BonusState, config: GameConfig): Readonly<{ state: BonusState; reward: number }>;
function advanceBonusEgg(state: BonusState, config: GameConfig): BonusState;
function totalBonus(state: BonusState, hatched: number, config: GameConfig): number;

// src/audio.ts
function createMusicPlayer(config: GameConfig): {
    select(track: 'off' | 0 | 1 | 2): Result<void, AudioError>;
    pause(): void;
    resume(): void;
};
```

The phase machine gains one transition: `game-over` + bonus-eligible → `bonus-round` → (skip or finish) → final game-over screen. Timing windows are core ticks (deterministic), not wall-clock timers.

## Tradeoffs

- **Bonus reward via existing tier table vs bespoke table:** chosen reuse — one scoring vocabulary, tunable in one place. Alternative rejected: a second table doubles the tuning surface for a cosmetic scene.
- **HTMLAudio vs Engine audio components:** chosen HTMLAudio — three looping tracks need no positional audio; the engine dependency would couple audio lifecycle to the app lifecycle for no benefit. Alternative rejected for this scope; revisitable if effects are added.
- **Bonus round inside the phase machine vs a modal overlay:** chosen a real phase — input routing, pause, and E2E state assertions reuse existing machinery. Alternative rejected: an overlay would special-case input and state snapshots.

## Reuse map

- `src/contracts/config.ts` — tier table, bonus enable flag, multiplier, track list.
- `src/game/phases.ts` — transition host (specs/game-phases).
- `src/hud.ts`, `src/input.ts` — display and Swap-press capture (specs/presentation-shell).
