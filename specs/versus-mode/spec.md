# Versus Mode — Spec

## Goal

Implement the two-player versus rules from spec §12.3: two independent boards ticking in lock-step, egg hatches sending N attack objects to the opponent, round wins by clearing first or by the opponent overflowing, victory tokens, and a match decided at 3 tokens. Covers acceptance tests T23–T26.

## User-visible behaviour

- Each side plays its own board with its own level/speed handicap.
- Completing an egg that encloses N monsters makes N extra falling objects appear on the opponent's field.
- Clearing your board first wins the round; overflowing loses it. First side to 3 tokens wins the match.

## Out of scope

- Networking/transport between sides — both boards simulate locally in lock-step (spec §12.3).
- Input routing to a specific side (shell feature).
- Host-only start/pause enforcement (shell; the machine already exposes per-side events).
- The bonus round and music.

## Open questions (resolved)

- _Attack composition [U]:_ resolved per spec §12.3 suggestion — N monster objects of seeded-random kinds in seeded-random columns; no attack when N = 0.
- _Attack interleaving [U]:_ resolved — pending attacks merge into the opponent's next batch, extending it beyond the normal size; they enter with the same stagger rule.
- _Simultaneous clear [U]:_ resolved — if both boards clear in the same tick, both sides gain a token (documented choice; no tie-breaking roulette).
- _Simultaneous overflow [U]:_ resolved — if both overflow in the same tick, the round is a draw: no tokens, round restarts.
- _Clear vs overflow on the same side in one tick:_ resolved — resolution precedes overflow (spec §8), so a clear that empties the board cannot simultaneously overflow; overflow is checked after resolution per spec §14.

## Edge cases

- N = 0 hatch sends no attack (T23 boundary).
- Multiple hatches in one tick queue multiple attacks in order.
- Attack objects arriving on a full opponent column follow normal landing/overflow rules — they can cause the loss (that is their purpose).
- A round win and an overflow on the same side in one tick: overflow wins (you cannot win a round you topped out on).
- Reaching 3 tokens ends the match immediately; no further rounds start (T26).
- Tokens persist across rounds; boards reset each round.
