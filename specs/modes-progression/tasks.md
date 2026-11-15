# Modes & Progression — Tasks

- [ ] T1 — Implement `applyTickEvents` score and hatch aggregation in `src/game/score.ts`
- [ ] T2 — Add unit tests for additive scoring and hatch counting in `src/game/score.dom.test.ts`
- [ ] T3 — Implement `registerFallen` and `advanceRamp` in `src/game/progression.ts`
- [ ] T4 — Add unit tests T17 (level-up at 40, ramp reset, batch size 3) in `src/game/progression.dom.test.ts`
- [ ] T5 — Implement `generatePrefill` with even-run construction in `src/game/stage.ts`
- [ ] T6 — Add unit tests for row counts per level, no initial matches, and seed reproducibility in `src/game/stage.dom.test.ts`
- [ ] T7 — Implement `isStageCleared` and `stageBonus` in `src/game/stage.ts`
- [ ] T8 — Add unit tests T18 plus bonus table lookups and clamping above the last row in `src/game/stage.dom.test.ts`
- [ ] T9 — Implement `adaptWeights` for nearly-finished boards in `src/game/supply.ts`
- [ ] T10 — Add unit tests proving adapted weights only produce clearing kinds at/below the threshold in `src/game/supply.dom.test.ts`
- [ ] T11 — Wire `pendingBatchSize` into the next-batch decision in `src/game/tick.ts`
- [ ] T12 — Add an integration test: 40 landings trigger exactly one 3-object batch then return to 2 in `src/game/tick.dom.test.ts`
