# Board Mechanics — Acceptance

Maps the mechanics spec §16 acceptance tests to unit tests of `landObject` / `resolveLanding`.

| Test | Given / When                                     | Then                                                |
| ---- | ------------------------------------------------ | --------------------------------------------------- |
| T1   | column `['m0']`, monster `m0` lands              | both removed, `points: 5`                           |
| T2   | column `['m1']`, monster `m0` lands              | `stacked`, column `['m1', 'm0']`, 0 points          |
| T3   | empty column, base lands                         | `stacked`, column `['base']`                        |
| T4   | column `['base']`, base lands                    | both removed, `points: 5`                           |
| T5   | column `['m2']`, base lands                      | `stacked`, column `['m2', 'base']`                  |
| T6   | column `['m0']`, cap lands, no base present      | `cap-vanished`, 0 points                            |
| T7   | column `['base']`, cap lands                     | `hatched`, enclosed 0, tier 1, +50, column `[]`     |
| T8   | column `['base','m0','m1','m2']`, cap lands      | enclosed 3, tier 2, +100                            |
| T9   | column `['base', ×5 monsters]`, cap lands        | enclosed 5, tier 3, +200                            |
| T10  | 7-high column `['base', ×6 monsters]`, cap lands | enclosed 6, tier 4, +500, `gameOver: false`         |
| T11  | column `['m3','base','m0','m1']`, cap lands      | hatch removes from bound base up; `['m3']` survives |
| T12  | column `['base','m0','base','m1']`, cap lands    | binds topmost base; `['base','m0']` survives        |
| T19  | 7-high column, top `m1`, monster `m0` lands      | `gameOver: true`                                    |
| T20  | 7-high column, top `m0`, monster `m0` lands      | `pair-cleared`, `gameOver: false`                   |
| —    | column `['m0','m1']`, monster `m0` lands         | `stacked` — buried `m0` never matches               |
