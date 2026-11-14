# Board Mechanics — Tasks

- [ ] T1 — Implement `heightOf`, `topOf`, `pushItem`, `dropTop` in `src/game/board.ts`
- [ ] T2 — Add unit tests for stack queries including empty columns in `src/game/board.dom.test.ts`
- [ ] T3 — Implement `hatchTierFor` and `findTopmostBaseIndex` in `src/game/egg.ts`
- [ ] T4 — Add unit tests for tier lookup boundaries (0, 1–3, 4–5, 6) in `src/game/egg.dom.test.ts`
- [ ] T5 — Implement `resolveLanding` monster and base-half branches in `src/game/resolve.ts`
- [ ] T6 — Add unit tests T1–T5 (monster match, mismatch, base on empty, base pair, base on monster) in `src/game/resolve.dom.test.ts`
- [ ] T7 — Implement the cap-half branch of `resolveLanding` via `src/game/egg.ts`
- [ ] T8 — Add unit tests T6–T12 (vanish, tiers 1–4, survivors below base, topmost binding) in `src/game/egg.dom.test.ts`
- [ ] T9 — Implement `causesOverflow` and `landObject` in `src/game/overflow.ts`
- [ ] T10 — Add unit tests T10, T19, T20 (full-column hatch, overflow loss, match-beats-overflow) in `src/game/overflow.dom.test.ts`
- [ ] T11 — Add a unit test proving buried identical monsters never match in `src/game/resolve.dom.test.ts`
