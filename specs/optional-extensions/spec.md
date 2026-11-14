# Optional Extensions — Spec

## Goal

Implement the two documented-but-optional extras: the endless-mode post-game bonus round (spec §12.1, details `[U]`, designed fresh) and the menu music setting (three tracks plus off, presentation only). Both are isolated so the core game is complete without them.

## User-visible behaviour

- After an endless game over with at least 10 hatched creatures, a bonus round offers four eggs hatching in sequence; a timed press influences the reward, which grows with total hatch count.
- The music menu setting selects one of three tracks or off; the choice is audible during play.

## Out of scope

- Any change to core rules, scoring of normal play, or versus.
- Composing or sourcing final audio assets (placeholder files under `public/` are fine).
- Visual polish of the bonus scene beyond a functional minimum.

## Open questions (resolved)

- _Bonus round details [U]:_ resolved as fresh design — four eggs hatch one after another; each egg shows a shrinking timing bar; pressing Swap inside the target window upgrades that egg's reward one tier (per the normal tier table); total bonus = sum of the four eggs, scaled by `hatched` count via a config multiplier.
- _Opt-out:_ resolved — the bonus round is skippable with Start and entirely disabled via config flag.
- _Music implementation:_ resolved — HTMLAudio elements for three looping tracks under `public/audio/`, selected by the menu's music value, no engine audio components.

## Edge cases

- Bonus round with exactly 10 hatched triggers; 9 does not.
- Skipping the bonus round still records the endless score.
- Music "off" plays nothing and loads no audio.
- Switching modes or pausing pauses playback; resume continues.
- Missing audio files degrade to silence with a typed `Result.error` logged, never a crash.
