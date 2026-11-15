# Versus Mode — Acceptance

## Attacks (spec §12.3)

- T23: left completes an egg enclosing N = 3 monsters → right's `pendingAttack` grows by exactly 3 monster objects with fixed kinds/columns, merged into right's next batch.
- N = 0 hatch → no `attack-sent` event, `pendingAttack` unchanged.
- Two hatches in one tick enqueue both attacks in hatch order.

## Rounds and tokens (spec §12.3)

- T24: left's board becomes empty (no falling/pending) while right's does not → `round-decided { type: 'cleared', side: 'left' }`, left tokens +1.
- T25: left overflows → `round-decided { type: 'overflow', side: 'left' }`, right tokens +1.
- Both clear in the same tick → `both-cleared`, both tokens +1.
- Both overflow in the same tick → `draw-overflow`, tokens unchanged, `startRound` re-initializes both boards, `round` increments.
- T26: when a side's tokens reach 3, `match-decided` fires and no new round starts.

## Determinism (spec §12.3)

- Two `tickVersus` runs with identical seeds and identical input sequences produce identical states and event streams after 500 ticks.
