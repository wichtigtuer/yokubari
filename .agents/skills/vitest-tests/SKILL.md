---
name: vitest-tests
description: Use when writing, running, or debugging unit tests in this project, which uses Vitest through Vite+ (`vp test`) in browser mode with Playwright. Covers imports, file naming, coverage, lint rules, and PlayCanvas-specific pitfalls.
---

# Vitest unit tests

Tests run with Vitest 5, bundled inside Vite+ — there is no `vitest` dependency and no
`vitest.config.ts`. All test configuration lives in the `test` block of `vite.config.ts`.

Tests execute in real browsers (headless chromium, firefox and webkit) via Playwright, not jsdom.
DOM APIs, custom elements and WebGL-capable canvas exist for real; Node APIs (`fs`, `process`, …)
do not.

## Commands

- `pnpm test` or `vp test` — single run across all three browsers.
- `vp test watch` — watch mode (`vp test` alone does not watch).
- `vp test run --coverage` — istanbul coverage, scoped to `src/**/*.ts` minus entry files.
- `pnpm exec playwright install` — required once after checkout to fetch browser binaries.

## Writing a test

- Name browser tests `*.dom.test.ts` under `src/` (the configured `include`). `**/*.node.test.ts`
  is excluded — this project has no Node test project; use the `node-native-tests` skill instead
  for Node-only tooling.
- Import from `vite-plus/test`, never from `vitest` — the `vite-plus/prefer-vite-plus-imports`
  lint rule errors otherwise:

  ```ts
  import { describe, expect, it, vi } from 'vite-plus/test';
  ```

- For DOM interaction, use the browser context and locators:

  ```ts
  import { page, userEvent } from 'vite-plus/test/browser/context';
  ```

- Import order is linted (`sort-imports`): side-effect imports first, then multi-name imports,
  then single-name imports (`import { Vec3 } from 'playcanvas'` counts as "single").
- `no-magic-numbers` and `no-unused-expressions` are off in test files; `id-length` is not —
  no one-letter variables.
- Side-effect imports (e.g. `import '@playcanvas/web-components';` to register elements) are
  allowed in `*.dom.test.ts`.

## PlayCanvas specifics

- Prefer unit tests of pure logic: engine math (`Vec3`, `Quat`, …), helpers, attribute parsing.
- Do not boot a full `<pc-app>` in a unit test unless the test needs a graphics device — it is
  slow and can fail headless. Registering custom elements via
  `import '@playcanvas/web-components'` is cheap and safe.
- When waiting on elements, use `whenReady()` or `element.ready()` from
  `@playcanvas/web-components`. A misplaced element never becomes ready — listen for its `error`
  event instead of awaiting forever.
- Each test file runs in all three browsers; avoid engine or CSS features with known
  per-browser differences unless the test is about them.

## Changing the test setup

- Edit the `test` block in `vite.config.ts`. Do not create `vitest.config.ts`.
- v8 coverage rejects multiple browser instances; keep `provider: 'istanbul'` while
  chromium/firefox/webkit all run.
- New test-related packages go in the `catalog` in `pnpm-workspace.yaml` and are referenced as
  `catalog:` in `package.json`. Keep `@vitest/browser-playwright` matched to the Vitest version
  bundled by `vite-plus` (check `node_modules/vite-plus/package.json`).
- Freshly published packages can fail the environment's `minimumReleaseAge` policy on
  `pnpm install`; prefer a slightly older, already-aged version over adding
  `minimumReleaseAgeExclude` entries.

## Before finishing

Run `pnpm run typecheck`, `pnpm run lint`, `pnpm run fmt` and `pnpm test` — all must pass.
