# AGENTS.md

A PlayCanvas app in TypeScript, built with Vite. The scene is declared in HTML with `@playcanvas/web-components`, custom elements that drive the PlayCanvas Engine. `README.md` describes the starter this project began from and how to control it.

## Commands

- `pnpm install` installs dependencies.
- `pnpm run dev` starts the dev server, usually at <http://localhost:5173>, with hot reload and the PlayCanvas Inspector.
- `pnpm run typecheck` checks types.
- `pnpm run lint` runs the linter (Oxlint, via Vite+), and `pnpm run lint:fix` fixes what it can.
- `pnpm run fmt` checks formatting, and `pnpm run fmt:fix` applies the formatter (Oxfmt, via Vite+).
- `pnpm run build` builds the production site into `dist/`, and `pnpm run start` serves it.
- `pnpm run ok` runs the OK script (`scripts/ok.ts`), which runs formatting, linting, typechecking, unit tests and e2e tests in sequence and fails fast on the first error.
- `pnpm run test:e2e` runs the Playwright E2E suite in `e2e/` against the dev server, `pnpm run test:e2e:coverage` also collects istanbul coverage and reports it with nyc, and `pnpm run test:e2e:update-snapshots` regenerates screenshot and replay-state baselines.
- `pnpm run dev` and `pnpm run start` open the page in the default browser.

## Layout

- `index.html` holds the scene: `<pc-app>` wraps a `<pc-scene>` of `<pc-entity>` elements, with components such as `<pc-camera>`, `<pc-light>` and `<pc-render>` inside them.
- `src/main.ts` does what HTML can't, such as attaching scripts and handling input.
- `src/starter.css` styles the page and the starter's panels.
- `src/inspector.ts` loads the Inspector. `vite.config.ts` adds it in the dev server only, so production builds leave it out.
- `public/` holds files copied into the build as they are, such as models and textures.

## E2E testing

- Playwright specs live in `e2e/` (`*.spec.ts`), driven by `e2e/base-fixtures.ts`, which collects istanbul coverage from `window.__coverage__` into `.nyc_output/` and exposes the shared helpers `gotoTestMode`, `stepFrames`, `dispatchInput`, `getState`, `freezeForSnapshot` and `runReplay`.
- Specs run in test mode (`/?test=1`): `src/main.ts` attaches `window.__pcTestApi` (from `src/test-api.ts`) when the dev server runs with `VITE_TEST_MODE=1`, which `playwright.config.ts` sets on its webServer. Test mode freezes the real-time clock (`app.timeScale = 0`), so the simulation only advances through `stepFrames(n)` logical ticks of fixed `dt`.
- Snapshot/replay tests feed a JSON fixture from `e2e/fixtures/` through `runReplay` and compare the final state against a committed snapshot in `e2e/<spec>-snapshots/`; screenshot tests carry an `@snapshot` tag and assert with `toHaveScreenshot`.
- Firefox runs headed under Xvfb on headless Linux (started by `e2e/global-setup.ts`), because headless Firefox cannot create a WebGL device there.
- `vite.config.ts` instruments `src/` with `vite-plugin-istanbul` when `VITE_COVERAGE=true`; `.nycrc.json` configures `nyc report` (output in `coverage/e2e/`).

## Conventions

- Attribute values are strings, such as `position="0 0 3"` and `clear-color="#8099e6"`. `node_modules/@playcanvas/web-components/dist/custom-elements.json` lists every element and its attributes.
- Attach a script that's imported through the bundler in `src/main.ts`, not with `<pc-script-instance name="...">`, which only finds scripts that a `<pc-asset>` fetched at runtime. Wait for the element with `whenReady()`, then add the script through its `.entity`.
- `<pc-app>` dispatches ordinary pointer events, such as `pointerup`, on the `<pc-entity>` under the pointer, so listen for them on the element. Only entities with a listener receive them.
- Builds use relative URLs (`base: './'` in `vite.config.ts`), so they run from any folder. Load files in `public/` with relative paths such as `./model.glb`, not `/model.glb`.
- The engine ships ready-made scripts, such as camera controls and character controllers, under `playcanvas/scripts/esm/`. Use one before writing the same behavior yourself.
- `node_modules/playcanvas/build/playcanvas.d.ts` documents the installed engine's API.
- TypeScript is strict, and unused locals and parameters are errors.

## Checking your work

- Run `pnpm run typecheck`, `pnpm run lint` and `pnpm run build` before you finish. All three must pass.
- Always run `pnpm run ok` after a feature is completed. It must pass before the work is considered done.
- To see the result, run `pnpm run dev` and open the page in a browser. The console should show `Powered by PlayCanvas` and no errors. Press the backquote key for the Inspector, which shows the hierarchy, assets, materials, textures, frame graph and physics. <kbd>F9</kbd> pauses and <kbd>F10</kbd> steps a frame.

## Agent skills

`.agents/skills/` hold PlayCanvas skills for coding agents. Use them rather than working from memory: `build-app` when restructuring the app, `find-examples` for a feature the project doesn't use yet, `reuse-scripts` before writing a behavior, `inspect-glb` before placing a model, `inspect-runtime` to read state from the running app, `verify-pixels` to prove a refactor leaves the image unchanged, `vitest-tests` when writing or running unit tests, and `e2e-tests` when writing or running Playwright E2E tests.
