---
name: e2e-tests
description: Use when writing, running, or debugging Playwright E2E tests in this project. Covers the test-mode manual clock (`window.__pcTestApi`), shared fixtures and helpers, snapshot/replay testing, screenshot baselines, istanbul coverage, and pitfalls (async GPU picks, cross-engine floats, Xvfb for Firefox, lint overrides).
---

# Playwright E2E tests

E2E specs live in `e2e/` as `*.spec.ts`, run by `@playwright/test` against the dev server that
`playwright.config.ts` starts with `VITE_COVERAGE=true` and `VITE_TEST_MODE=1`. Vitest unit tests
(`*.test.ts`) are a different suite — see the `vitest-tests` skill.

## Commands

- `pnpm run test:e2e` — run all specs across chromium, firefox, webkit, Mobile Chrome, Mobile Safari.
- `pnpm run test:e2e:coverage` — prune, run, then `nyc report` into `coverage/e2e/`.
- `pnpm run test:e2e:update-snapshots` — regenerate replay-state and `@snapshot` screenshot baselines.
- `pnpm exec playwright test e2e/replay.spec.ts --project=chromium` — run one spec in one browser.

## Architecture

- Test mode is `/?test=1` on the dev server: `src/main.ts` attaches `window.__pcTestApi` (from
  `src/test-api.ts`) only when `import.meta.env.VITE_TEST_MODE === '1'`. Production builds drop it.
- Test mode freezes the real-time clock (`app.timeScale = 0`). The simulation advances only through
  `stepFrames(n)`, which calls `app.update(FIXED_DT)` per logical tick and counts them in
  `frameIndex`. Render-only rAF frames never move the simulation.
- `e2e/base-fixtures.ts` exports the coverage-collecting `test`/`expect` and the shared helpers
  `gotoTestMode`, `stepFrames`, `dispatchInput`, `getState`, `freezeForSnapshot`, `runReplay`.
  Always import from there — never from `@playwright/test` directly, or coverage is lost.
- istanbul instrumentation comes from `vite-plugin-istanbul` in `vite.config.ts` (only when
  `VITE_COVERAGE=true`); the fixture drains `window.__coverage__` into `.nyc_output/` per page and
  `nyc report` (`.nycrc.json`) reads it.

## Writing a spec

```ts
import { expect, gotoTestMode, getState, stepFrames, test } from './base-fixtures';

test('spinning advances deterministically', async ({ page }) => {
    await gotoTestMode(page);           // goto /?test=1 and wait for __pcTestApi
    const state = await stepFrames(page, 60);
    expect(state.frameIndex).toBe(60);
});
```

Rules:

- Synchronize on observable state (`waitForFunction`, locator assertions), never on fixed sleeps.
  Put new wait logic in `base-fixtures.ts` helpers, not inline in specs.
- Every locator created must end in an assertion (`toBeVisible`, `toHaveScreenshot`, …).
- Screenshot tests carry an `@snapshot` tag and assert with
  `await expect(locator).toHaveScreenshot('name.png')` after `freezeForSnapshot(page)`.

## Snapshot / replay tests

- Fixtures are JSON in `e2e/fixtures/`, parsed by `parseReplayFixture` (`e2e/replay-fixture.ts`),
  which returns a typed `Result` and never throws. Import them with an attribute:
  `import fixture from './fixtures/x.json' with { type: 'json' };`
- Feed fixtures through `runReplay(page, fixture)`, then compare state:
  `expect(JSON.stringify(state, null, 2)).toMatchSnapshot('name.json')`. Pass a **string** to
  `toMatchSnapshot` — an object value fails with `file.slice is not a function`.
- Snapshots land in `e2e/<spec>-snapshots/` with a per-project suffix; those directories are in
  the fmt/lint `ignorePatterns` because Playwright regenerates them.

## Pitfalls

- **Async GPU picks.** `<pc-app>` synthesizes entity pointer events through an async GPU readback.
  After `canvas.click()`, wait for the state change (`waitForFunction`), not for the event.
- **Cross-engine floats.** Trig differs by ~1 ulp between browsers, so `getState()` rounds
  rotations to 6 decimals. Keep assertions on rounded state; don't compare raw floats.
- **-0.** Quaternion→euler conversion yields `-0` for zeroed axes, and `toStrictEqual` rejects it.
  The API normalises with `+ 0`; prefer `toEqual` if you hit this elsewhere.
- **Early frames.** Real-time frames run before the test API attaches; it resets the cube's
  orientation at attach time so state starts from a known zero.
- **Firefox on headless Linux** cannot create a WebGL device headless. `e2e/global-setup.ts`
  starts Xvfb and the firefox project runs headed against it. If Xvfb is missing, install it
  (`apt install xvfb`) or deselect the firefox project.
- **First-run reloads.** A cold dev server re-bundles dependencies mid-run and reloads pages,
  failing in-flight tests. Re-run; deps are cached afterwards.

## Lint and config

- `e2e/**` and `playwright.config.ts` have a lint override block in `vite.config.ts`
  (`no-async-await`, `func-style`, `strict-boolean-expressions`, …). `src/test-api.ts` has its own.
- Rules still active and commonly hit: `capitalized-comments` (every comment line starts
  uppercase), `sort-keys` (natural, hyphen-insensitive), `no-undefined`, `unicorn/no-null`.
- New test-related packages go in the `catalog` in `pnpm-workspace.yaml`, referenced as `catalog:`.

## Before finishing

Run `pnpm run typecheck`, `pnpm run lint`, `pnpm run fmt` and `pnpm run test:e2e` — all must pass.
Commit regenerated baselines (`e2e/*-snapshots/`) together with the change that produced them.
