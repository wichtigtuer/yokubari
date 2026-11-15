# Foundations — Tasks

- [ ] T1 — Add `Result`/`Option` types and constructors to `src/utils/result.ts`
- [ ] T2 — Add unit tests for `ok`/`err`/`some`/`none`/`mapResult`/`flatMapResult` in `src/utils/result.dom.test.ts`
- [ ] T3 — Implement `pipe()` with typed overloads in `src/utils/pipe.ts`
- [ ] T4 — Add unit tests for `pipe()` composition order in `src/utils/pipe.dom.test.ts`
- [ ] T5 — Add `Brand<K, T>` type to `src/utils/brand.ts`
- [ ] T6 — Implement `createRng` and `nextInt` in `src/utils/random.ts`
- [ ] T7 — Add unit tests for RNG determinism and `nextInt` bounds in `src/utils/random.dom.test.ts`
- [ ] T8 — Implement `weightedChoice` returning `Result` in `src/utils/random.ts`
- [ ] T9 — Add unit tests for `weightedChoice` weights and error cases in `src/utils/random.dom.test.ts`
- [ ] T10 — Add domain types from spec §15 to `src/contracts/types.ts`
- [ ] T11 — Add `GAME_CONFIG` with all `[U]` placeholders to `src/contracts/config.ts`
- [ ] T12 — Add unit tests asserting config invariants (tier table ascending, max enclosed 6 < capacity 7) in `src/contracts/config.dom.test.ts`
