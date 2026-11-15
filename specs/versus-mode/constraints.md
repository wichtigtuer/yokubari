# Versus Mode — Constraints

- **Lock-step determinism:** both boards advance by the same fixed tick; given identical seeds and input sequences, the event stream is byte-identical across runs and browsers (spec §12.3: "keep a lock-step, deterministic simulation per side").
- **No transport layer:** no networking, no shared memory between sides beyond the pure function's arguments.
- **Side isolation:** a side's RNG stream never influences the other side's board; attacks are materialized (kinds + columns fixed) at enqueue time.
- **Exception-free** adjudication; every outcome is a `RoundOutcome` value, never a throw.
- **No hidden coupling** to rendering or timers — `tickVersus` is callable headlessly by tests and the E2E replay harness.
