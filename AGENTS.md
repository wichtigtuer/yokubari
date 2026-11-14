# AGENTS.md

A PlayCanvas app in TypeScript, built with Vite. The scene is declared in HTML with `@playcanvas/web-components`, custom elements that drive the PlayCanvas Engine. `README.md` describes the starter this project began from and how to control it.

## Commands

- `pnpm install` installs dependencies.
- `pnpm run dev` starts the dev server, usually at <http://localhost:5173>, with hot reload and the PlayCanvas Inspector.
- `pnpm run typecheck` checks types.
- `pnpm run lint` runs the linter (Oxlint, via Vite+), and `pnpm run lint:fix` fixes what it can.
- `pnpm run fmt` checks formatting, and `pnpm run fmt:fix` applies the formatter (Oxfmt, via Vite+).
- `pnpm run test` runs the unit tests (Vitest in browser mode).
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

## Code Guidelines

These rules ensure maintainability, safety, and developer velocity. **MUST** rules are enforced in review; **SHOULD** rules are strongly recommended. They apply to new and touched code — parts of the existing codebase predate them.

### Before Coding

- **BP-1 (MUST)** Ask the user clarifying questions when requirements are ambiguous.
- **BP-2 (SHOULD)** Draft and confirm an approach for complex work. For non-trivial features, invoke the `sdte-loop` skill.
- **BP-3 (SHOULD)** If ≥ 2 approaches exist, list clear pros and cons.

### While Coding

- **C-1 (MUST)** Follow TDD: scaffold stub -> write failing test -> implement.
- **C-2 (MUST)** Name functions with existing domain vocabulary for consistency.
- **C-3 (SHOULD NOT)** Introduce classes when small testable functions suffice. Classes required by the platform — PlayCanvas `Script` classes, Web Components — are exempt.
- **C-4 (SHOULD)** Prefer simple, composable, testable functions.
- **C-5 (MUST)** Prefer branded `type`s for IDs.
    ```ts
    type EntityId = Brand<string, 'EntityId'>; // ✅ Good
    type EntityId = string; // ❌ Bad
    ```
- **C-6 (MUST)** Use `import type { … }` for type-only imports.
- **C-7 (SHOULD NOT)** Add comments except for critical caveats; rely on self-explanatory code.
- **C-8 (SHOULD)** Default to `type`; use `interface` only when more readable or interface merging is required.
- **C-9 (SHOULD NOT)** Extract a new function unless it will be reused elsewhere, is the only way to unit-test otherwise untestable logic, or drastically improves readability of an opaque block.
- **C-10 (SHOULD)** Name by kind: functions use verbs (`updatePlayer`, `clamp`), variables/types use nouns (`SceneConfig`, `enemies`), booleans use predicates (`isActive`, `playerMoved`).
- **C-11 (SHOULD NOT)** Use boolean parameters to control function behaviour — split into two explicit functions instead.
- **C-12 (SHOULD NOT)** Reassign function parameters. Treat every parameter as `const`.
- **C-13 (SHOULD NOT)** Use vague names like `data`, `item`, `thing`, `info`, `value`, `obj`, `result`. Prefer intent-revealing names (`entityList`, `pendingActions`, `parsedInput`).
- **C-14 (SHOULD NOT)** Use abbreviations beyond well-established acronyms (DOM, URL, HTTP, ID). `entLst` is wrong; `entityList` is right.
- **C-15 (SHOULD NOT)** Nest control flow more than three levels deep. Flatten with early returns, extracted predicates, or `pipe()` composition.
- **C-16 (MUST)** Return explicitly. Every function declares its return type; implicit `undefined` returns are forbidden. A function that legitimately returns nothing returns `void`.
- **C-17 (SHOULD NOT)** Use imperative loops (`for`, `while`, `do…while`) when `.map()`, `.filter()`, `.reduce()`, or `pipe()` express the intent more clearly. Reach for declarative iteration first.
- **C-18 (SHOULD NOT)** Use the `this` keyword in domain code. Domain logic is built from standalone functions; `this` may appear only where the platform requires it (PlayCanvas `Script` classes, Web Component lifecycle methods such as `connectedCallback`).
- **C-19 (SHOULD NOT)** Declare module-level mutable state. Modules export `const` bindings and pure functions only — no top-level `let` reassignment, no `var`, no exported mutable objects. Shared mutable state lives in a dedicated state module. A local `let` inside a single function as an accumulator is acceptable but `.reduce()` is usually clearer.
- **C-20 (MUST)** Keep functions ≤ 50 lines.
- **C-21 (MUST)** Keep functions to ≤ 10 statements.
- **C-22 (MUST)** Do not use magic numbers. Give domain numbers intent-revealing names as constants.

### Code Organization

- **O-1 (MUST)** As shared code grows, place reusable, domain-agnostic helper logic in `src/utils/` and shared runtime contracts (schemas and their inferred types) in `src/contracts/`.
- **O-2 (SHOULD)** Incremental progress over big bangs — small changes that compile and pass tests.
- **O-3 (SHOULD)** Learning from existing code — study and plan before implementing.
- **O-4 (SHOULD)** Pragmatic over dogmatic — adapt to project reality.
- **O-5 (MUST)** Clear intent over clever code — be boring and obvious.
- **O-6 (MUST)** Single responsibility per function/class.
- **O-7 (MUST)** Avoid premature abstractions.
- **O-8 (MUST)** If you need to explain it, it's too complex.
- **O-9 (MUST)** DRY — eliminate duplication via abstraction once the same logic appears in three places (Rule of Three). Two near-identical blocks may stay until the third confirms the pattern.
- **O-10 (MUST)** KISS — choose the boring, obvious approach. Cleverness is a defect; if a colleague has to ask "why is it like this?", simplify.
- **O-11 (MUST)** Keep files ≤ 300 lines (comments do not count), and target ~200 lines where practical. Files larger than this almost always hide a missing module boundary (in rare cases, ask for permission to create larger files). Don't remove comments or TSDoc annotations to satisfy the line limit.
- **O-12 (MUST)** One responsibility per file (extends O-6 from per-function to per-file). The file's name is its contract — if you can't pick a precise name, the file does too much.

### Architecture Principles

- **Functional Core, Imperative Shell** — side effects (DOM, engine/canvas, I/O, logging) live in the shell; the core is pure and has no knowledge of the shell.
- **Command–Query Separation** — a function either returns a value (query) or produces a side effect (command), never both.
- **Illegal States Unrepresentable** — encode invariants in the type system (discriminated unions, branded types, refinement via narrowing) so impossible states cannot be expressed.
- **Data-First Design** — pass data through transformations; do not wrap data in objects with methods. State is plain records; behaviour is free functions.
- **Point-Free Style** (where readable) — prefer `pipe(parse, validate, persist)` over `(x) => persist(validate(parse(x)))` when the intermediate names add no information.
- **Stable Dependencies Principle** — code depends in the direction of stability; less-stable code depends on more-stable code, never the reverse.
- **Functions as First-Class Values** — functions are passed, returned, and composed like any other value. Curried factories (`(config) => (input) => output`) are preferred over closures over module state.
- **Higher-Order Functions** — reach for `pipe`, `compose`, currying, and factory functions before reaching for new types or classes.
- **Algebraic Data Types (ADTs)** — sum types (discriminated unions) for choices, product types (records) for combinations. Classes are forbidden in domain code (C-3).
- **Wrap Effects in Explicit Functions** — every side-effecting call (fetch, timer, DOM access, engine mutation) lives in a named single-purpose function in the shell. Never inline `fetch()`, `requestAnimationFrame`, or `document.querySelector` into business logic.
- **Transform Before Update** — shell effects produce raw data → pure transformations turn it into typed actions → reducers apply actions to state. Never pipe shell results directly into a state mutation.
- **Composition over inheritance** — use dependency injection.
- **Interfaces over singletons** — enable testing and flexibility.
- **Explicit over implicit** — clear data flow and dependencies.
- **Test-driven when possible** — never disable tests, fix them.

Prefer a functional programming style to create predictable and testable code, and functional reactive patterns where they fit. Only use observables that conform to the WICG Observable API proposal.

Function composition is the primary method for building complex logic from simple, reusable functions; when composition gets deep, use a small `pipe()` utility from `src/utils/` (create it the first time it's needed). Curry functions when it aids partial application, especially within a `pipe`.

### Error Handling

The codebase is **exception-free everywhere**. Errors are values, not control flow.

- **Exception-Free Rule** — domain and shell code never `throw`. Functions return `Result<T, E>` or `Option<T>` and surface failures as values.
- **Railway-Oriented Programming** — chain operations through `Result<T, E>`. The success track threads transformations; the failure track short-circuits without ceremony.
- **Standard return shapes** — define these once in `src/utils/` and reuse everywhere:

    ```ts
    type Result<T, E> = { type: 'ok'; value: T } | { type: 'error'; error: E };
    type Option<T> = { type: 'some'; value: T } | { type: 'none' };
    ```

- **Boundary conversion** — third-party APIs that throw must be wrapped at the call site so the error becomes a `Result.error`. Throws are never re-thrown into our code.
- **No silent failures** — every failure mode is encoded in the return type. Drop-on-floor handling is forbidden; an explicit `Result.error` with a typed reason is mandatory.
- **Descriptive errors** — the `E` type carries enough context for debugging (typed reason code + relevant inputs); string-only errors are forbidden in new code.

### TypeScript

TypeScript is strict, and unused locals and parameters are errors.

1. **Be explicit** — provide types for all function parameters and return values. All types in TypeScript files carry TSDoc annotations.
2. **No type assertions** — avoid `as` and `<Type>` casts; treat them as errors unless explicitly justified. Refactor existing casts into safe alternatives.
3. **Allowed instead of casts** — type narrowing (`typeof`, `in`, discriminated unions), user-defined type guards (`obj is T`), the `satisfies` operator, and proper generics.
4. **Disallowed** — `value as Type`, `<Type>value`, casting from `any` or `unknown` without validation. `any` is strictly forbidden; use `unknown` and narrow.
5. **Exceptions** — allowed only with an explicit lint suppression and a justification comment.
6. **Readonly on shared types** — use `Readonly<T>` / `ReadonlyArray<T>` (or `readonly` modifiers) for every type that flows through state, props, or a public API:

    ```ts
    type SceneState = Readonly<{
        player: Readonly<Player>;
        enemies: ReadonlyArray<Enemy>;
    }>;
    ```

### Testing

Testing rules complement the `vitest-tests` and `e2e-tests` skills (which cover file conventions and tooling). The rules here are non-negotiable properties every test must satisfy.

- **T-1 (MUST)** Tests follow **FIRST principles**. Each is a defect if missing:
    - **F**ast — runs in milliseconds; slow tests get skipped and rot.
    - **I**ndependent — no shared state, no order dependency. Any test runs in isolation.
    - **R**epeatable — deterministic. Same input, same result, every machine, every run.
    - **S**elf-validating — boolean pass/fail with no human inspection of output.
    - **T**imely — written alongside (or before, per C-1) the code under test, never bolted on later.
- **T-2 (SHOULD)** Test bodies use **Given–When–Then** structure (or `// arrange`, `// act`, `// assert` comments) so a reader sees the setup, action, and expectation at a glance.
- **T-3 (MUST)** **Black-box testing** — assert against observable behaviour through the public API only. Never reach into private implementation, internal state shape, or call counts. A behaviour-preserving refactor must not require touching tests.
- **T-4 (MUST)** Gameplay E2E tests are state-first. Use the deterministic `?test=1` browser API (`window.__pcTestApi`) for simulation assertions, and reserve screenshots for static DOM regions or frames frozen via `freezeForSnapshot()`.

### Git

- **GH-1 (MUST)** Use Conventional Commits format for commit messages: <https://www.conventionalcommits.org/en/v1.0.0>. The message explains "why", not just "what".
- **GH-2 (SHOULD NOT)** Refer to AI tools or vendors (Gemini, Google, Claude, Anthropic, etc.) in commit messages.

**NEVER**:

- Use `--no-verify` to bypass commit hooks.
- Disable tests instead of fixing them.
- Commit code that doesn't compile.
- Make assumptions — verify with existing code.

**ALWAYS**:

- Commit working code incrementally — every commit compiles, passes all existing tests, includes tests for new functionality, and follows formatting/linting.
- Update plan documentation as you go.
- Learn from existing implementations.
- Self-review changes before committing, and run `pnpm run ok`.
- Stop after 3 failed attempts and reassess.

## Checking your work

The tooling gates, all of which **MUST** pass before work is considered done:

- **G-1** `pnpm run fmt` passes (`pnpm run fmt:fix` applies the formatter).
- **G-2** `pnpm run lint` passes (`pnpm run lint:fix` auto-fixes fixable issues).
- **G-3** `pnpm run test` passes.
- **G-4** `pnpm run typecheck` passes.
- **G-5** `pnpm run build` passes.
- **G-6** After a feature is completed, `pnpm run ok` passes — it runs all of the above plus the E2E suite and fails fast on the first error.

To see the result, run `pnpm run dev` and open the page in a browser. The console should show `Powered by PlayCanvas` and no errors. Press the backquote key for the Inspector, which shows the hierarchy, assets, materials, textures, frame graph and physics. <kbd>F9</kbd> pauses and <kbd>F10</kbd> steps a frame.

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

## Agent skills

`.agents/skills/` hold PlayCanvas skills for coding agents. Use them rather than working from memory: `build-app` when restructuring the app, `find-examples` for a feature the project doesn't use yet, `reuse-scripts` before writing a behavior, `inspect-glb` before placing a model, `inspect-runtime` to read state from the running app, `verify-pixels` to prove a refactor leaves the image unchanged, `vitest-tests` when writing or running unit tests, `e2e-tests` when writing or running Playwright E2E tests, and `sdte-loop` for non-trivial features (per BP-2).
