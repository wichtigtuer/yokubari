# Presentation Shell — Acceptance

## End-to-end coverage

Every acceptance test T1–T26 from the mechanics spec passes as a state-first Playwright test:

- T1–T12 landing/hatching via scripted batches (seeded test mode) → `getState()` asserts columns, score, hatched.
- T13–T14 swap behaviour; T15 soft drop (frame counts with/without Down); T16 pause freeze.
- T17 level-up at 40 fallen; T18 stage-clear bonus; T19–T20 overflow rules.
- T21–T22 carry rule; T23–T26 versus attacks, tokens, match end.
- Replay: committed fixtures in `e2e/fixtures/` reproduce their committed final-state snapshots via `runReplay`.

## Rendering smoke

- Static screens (title, menu, pause overlay, game-over) pass `toHaveScreenshot` with `@snapshot` tag.
- A 7-high column renders fully inside the field; carried objects render in their new column after the tween.

## Build hygiene

- `pnpm run build` output contains no `__pcTestApi`, no Inspector, and `pnpm run ok` passes end to end.
