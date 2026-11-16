# Foundations — Spec

## Goal

Provide the shared primitives every later stack-routing feature builds on: exception-free `Result`/`Option` plumbing, a `pipe()` composition utility, branded ID types, a seedable deterministic RNG, the game's domain types, and a single config module holding every `[U]` tunable from the mechanics specification as data. Nothing user-visible ships in this feature; it is the vocabulary the rest of the codebase speaks.

## User-visible behaviour

- None. This feature is library groundwork only.

## Out of scope

- Any game rule (matching, hatching, overflow, spawning, gravity, swapping).
- Rendering, input, audio, or engine integration.
- Loading config from external files; config is typed source data.

## Open questions (resolved)

- _Which RNG algorithm?_ Resolved: mulberry32 — small, well-known, deterministic, sufficient for a puzzle game; the factory interface allows swapping implementations.
- _Where do `[U]` placeholders live?_ Resolved: one `GAME_CONFIG` const in `src/contracts/config.ts`, typed with `satisfies`, never read from globals.
- _Result/Option from a library?_ Resolved: hand-rolled in `src/utils/result.ts` — no new dependency (KISS, O-7).

## Edge cases

- Seed `0` must still produce a valid sequence (mulberry32 handles this natively).
- `weightedChoice` with all-zero weights returns a typed `Result.error`, never throws.
- `pipe()` must preserve types across up to the arity actually used; no `any`.
- Two RNG instances created with the same seed must yield identical sequences (test reproducibility, spec §4).
