/**
 * Nominal typing helper: intersects a base type with a compile-time-only marker so two brands of
 * the same primitive (e.g. `ObjectId` vs a plain `number`) are not interchangeable.
 */
export type Brand<TBase, TTag> = TBase & { readonly __brand: TTag };
