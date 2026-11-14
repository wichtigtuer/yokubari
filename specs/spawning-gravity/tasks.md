# Spawning & Gravity — Tasks

- [ ] T1 — Implement `generateBatch` with distinct columns, staggered delays and weighted types in `src/game/spawn.ts`
- [ ] T2 — Add unit tests for batch size, distinct columns, stagger order and seed reproducibility in `src/game/spawn.dom.test.ts`
- [ ] T3 — Implement `fallIntervalTicks`, `stepFalling` and `hasLanded` in `src/game/gravity.ts`
- [ ] T4 — Add unit tests for interval lookup, soft-drop division (T15) and landing detection in `src/game/gravity.dom.test.ts`
- [ ] T5 — Implement `tickBoard` landing pipeline (advance → resolve → events) in `src/game/tick.ts`
- [ ] T6 — Add unit tests for tick ordering and immediate resolution (no lock delay) in `src/game/tick.dom.test.ts`
- [ ] T7 — Wire next-batch spawning into `tickBoard` when the field is empty of falling objects
- [ ] T8 — Add unit tests for spawn cadence and `batch-spawned` events in `src/game/tick.dom.test.ts`
