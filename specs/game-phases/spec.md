# Game Phases — Spec

## Goal

Implement the game's phase machine from spec §13: title → menu → ready → playing ⇄ paused, plus stage-clear, game-over, and the versus-only round-result/match-result phases. Includes the menu parameters (mode, level, speed, music) and the pause rule. Covers acceptance test T16.

## User-visible behaviour

- Title offers 1- or 2-player choice; menu edits mode/level/speed/music per side.
- Start begins play, and toggles pause/resume while playing.
- Pause freezes everything: gravity, animations-as-model-timers, and pending versus attack queues.
- Stage-clear and game-over phases are reachable only through their domain conditions (from earlier features), never by input alone.

## Out of scope

- Screen rendering and key bindings (shell feature).
- The versus token/round logic that _triggers_ round-result/match-result (versus feature emits the events; this machine consumes them).
- The optional bonus round after game over (extensions feature adds the phase transition).

## Open questions (resolved)

- _Pause freeze scope [U]:_ resolved per spec §13 default — everything freezes; the tick function simply does not run while paused.
- _Menu field editing:_ resolved per spec §5 — up/down chooses a field, left/right changes its value, values clamp at their documented ranges.
- _Per-side menus in versus:_ resolved per spec §12.0 — each side carries its own level and speed; the machine stores a pair of menu states.
- _Transition validity:_ illegal transitions (e.g. title → playing) are unrepresentable in the event/phase typing where possible and return `Result.error` otherwise.

## Edge cases

- Pause pressed during stage-clear or game-over is ignored (not an error).
- Resume returns to exactly the pre-pause board and timers — nothing advances while paused (T16).
- Selecting 2 players at title changes the menu shape (two sides) but not the available fields.
- Music "off" is a valid value; it has no gameplay effect.
- Level and speed changes in the menu never mutate a running game.
