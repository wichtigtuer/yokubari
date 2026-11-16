# Foundations — Constraints

- **Exception-free:** no `throw` anywhere; fallible operations return `Result.error` with a typed reason (`{ reason: ... }` object, never a bare string).
- **No runtime dependencies added.** These modules compile standalone.
- **Pure and immutable:** no module-level mutable state (C-19); RNG state lives inside the factory closure, one instance per consumer.
- **No classes** (C-3); factories return closures.
- **Branded types** for IDs (C-5); `Readonly` on every shared type (TypeScript rule 6).
- Every public function declares parameter and return types explicitly (C-16) and carries TSDoc.
