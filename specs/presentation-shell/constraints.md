# Presentation Shell — Constraints

- **Imperative shell, functional core:** no game rule may be implemented in `src/render/`, `src/input.ts`, `src/hud.ts` or `src/main.ts`; they only translate between DOM/engine and core state.
- **Determinism preserved:** simulation advances only through fixed core ticks; test mode keeps `timeScale = 0` and advances exclusively via `stepFrames` (AGENTS.md E2E conventions).
- **Dev-only test API:** `__pcTestApi` is attached only under `VITE_TEST_MODE=1` and dynamically imported, so production builds never ship it.
- **E2E is state-first (T-4):** assertions read `getState()`; screenshots only for static screens or frames frozen with `freezeForSnapshot()`.
- **No new runtime dependencies** for rendering or UI.
- **One swap per press:** OS key-repeat filtered in `src/input.ts` (spec §5).
