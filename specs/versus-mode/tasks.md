# Versus Mode — Tasks

- [ ] T1 — Implement `VersusState`, `SideState` and `startRound` in `src/game/versus.ts`
- [ ] T2 — Add unit tests for round initialization and token persistence in `src/game/versus.dom.test.ts`
- [ ] T3 — Implement attack enqueueing from `hatched` events in `tickVersus`
- [ ] T4 — Add unit tests T23 including the N = 0 no-attack boundary in `src/game/versus.dom.test.ts`
- [ ] T5 — Implement round adjudication (clear, overflow, simultaneous cases) in `tickVersus`
- [ ] T6 — Add unit tests T24, T25 plus both-cleared and draw-overflow cases in `src/game/versus.dom.test.ts`
- [ ] T7 — Implement match-end detection at 3 tokens
- [ ] T8 — Add unit test T26 and a lock-step determinism test (same seeds → identical event stream) in `src/game/versus.dom.test.ts`
