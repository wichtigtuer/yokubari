# Stack-Routing Puzzle — SDTE Index

Features in dependency order. Execute top to bottom; each feature's `tasks.md` is the source of truth for its execution loop (see `.agents/skills/sdte-loop/SKILL.md`).

| Order | Feature                | Contents                                                                     | Depends on |
| ----- | ---------------------- | ---------------------------------------------------------------------------- | ---------- |
| 1     | `foundations/`         | Result/Option, pipe, Brand, seeded RNG, domain types, `[U]` config           | —          |
| 2     | `board-mechanics/`     | landing resolution, egg hatching + tiers, overflow (T1–T12, T19, T20)        | 1          |
| 3     | `spawning-gravity/`    | batch generator, fall intervals, tick pipeline (T15)                         | 1, 2       |
| 4     | `input-swap/`          | cursor, tray swap, carry rule (T13, T14, T21, T22)                           | 1, 2       |
| 5     | `modes-progression/`   | endless level-up, stage prefill + bonus, adaptive supply, scoring (T17, T18) | 1–3        |
| 6     | `game-phases/`         | phase machine, menu params, pause freeze (T16)                               | 1, 5       |
| 7     | `versus-mode/`         | dual boards, attacks, tokens, match (T23–T26)                                | 2–6        |
| 8     | `presentation-shell/`  | rendering, input, HUD, screens, test API, E2E suite (T1–T26 e2e)             | 1–7        |
| 9     | `optional-extensions/` | bonus round, music                                                           | 1, 6, 8    |

Gates: every task ends green on `pnpm run ok` for affected checks before its checkbox is marked (S-20); one Conventional Commit per task referencing its task ID (S-23).
