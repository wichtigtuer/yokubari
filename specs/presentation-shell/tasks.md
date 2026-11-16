# Presentation Shell — Tasks

- [ ] T1 — Declare the scene (camera, light, 4 trays, HUD roots) in `index.html`
- [ ] T2 — Implement `src/render/board-view.ts` syncing stack and falling entities from `BoardState`
- [ ] T3 — Add unit tests for the state→entity mapping helpers in `src/render/board-view.dom.test.ts`
- [ ] T4 — Implement keyboard mapping with repeat filtering in `src/input.ts`
- [ ] T5 — Implement the fixed-timestep frame loop wiring in `src/main.ts`
- [ ] T6 — Implement the swap/carry tween in `src/render/swap-animation.ts` with input debounce
- [ ] T7 — Implement score/level/hatched/tokens overlay in `src/hud.ts`
- [ ] T8 — Implement title/menu/ready/stage-clear/game-over screens driven by `Phase`
- [ ] T9 — Extend `src/test-api.ts` with snapshot, scripted input and replay hooks
- [ ] T10 — Add E2E spec covering T1–T12 (landing, hatching) via state assertions in `e2e/stack-routing-board.spec.ts`
- [ ] T11 — Add E2E spec covering T13–T22 (swap, carry, progression, overflow) in `e2e/stack-routing-play.spec.ts`
- [ ] T12 — Add E2E spec covering T23–T26 (versus) in `e2e/stack-routing-versus.spec.ts`
- [ ] T13 — Add replay fixtures under `e2e/fixtures/` and snapshot baselines for static screens
- [ ] T14 — Verify production build excludes test API and Inspector (`pnpm run build`)
