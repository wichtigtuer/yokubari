# Presentation Shell — Spec

## Goal

Put the finished domain core on screen: four trays with their stacks and falling objects rendered from `GameState`, keyboard input mapped to domain actions, a swap/carry animation, HUD (score, level, hatched count, versus tokens), the title/menu/stage-clear/game-over screens, and the deterministic test API + E2E suite that proves acceptance tests T1–T26 end to end. This is the imperative shell over the pure core — all side effects live here.

## User-visible behaviour

- The game is playable in the browser with keyboard: Left/Right cursor, Swap buttons, held Down soft drop, Start for start/pause.
- Stacks visibly exchange trays on swap; carried falling objects visibly change columns.
- Hatch, score, level-up, stage-clear and game-over are visible as they happen.
- Title → menu → ready → playing flow works for 1P and 2P.

## Out of scope

- Any game rule — the shell only renders state and forwards events; rules are frozen by earlier features.
- Audio beyond hook points (extensions feature).
- Visual polish, art direction, particle effects.
- Networking for versus.

## Open questions (resolved)

- _Rendering approach:_ resolved — keep the project's `@playcanvas/web-components` scene; tray/stack objects are `<pc-entity>` subtrees updated from state each frame; no custom mesh code.
- _Swap animation:_ resolved — the model swaps instantly; the shell tweens tray positions over `swapAnimationTicks` from config and debounces swap input during it (spec §5 [U]).
- _Camera:_ resolved — fixed orthographic-style view of the 4×7 field; no camera controls needed.
- _Test API shape:_ resolved — extend the existing `window.__pcTestApi` (test mode only) with the full state snapshot plus scripted input, per the E2E conventions in AGENTS.md (state-first, `stepFrames`, `runReplay`).

## Edge cases

- Renders correctly at any state the core can produce, including a full 7-high column and a carried object mid-swap.
- Pause shows an indicator and freezes all motion.
- Held-key auto-repeat from the OS must not queue extra swaps (one swap per press, spec §5).
- Resize keeps the field centered and legible (web-components app handles canvas resize).
- Production build contains no test API and no Inspector (existing `vite.config.ts` behaviour preserved).
