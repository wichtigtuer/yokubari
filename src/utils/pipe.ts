/** Composes functions left to right: `pipe(v, f, g)` is `g(f(v))`. */
export function pipe<TValue>(value: TValue): TValue;
export function pipe<TA, TB>(value: TA, ab: (value: TA) => TB): TB;
export function pipe<TA, TB, TC>(value: TA, ab: (value: TA) => TB, bc: (value: TB) => TC): TC;
export function pipe<TA, TB, TC, TD>(
    value: TA,
    ab: (value: TA) => TB,
    bc: (value: TB) => TC,
    cd: (value: TC) => TD
): TD;
export function pipe<TA, TB, TC, TD, TE>(
    value: TA,
    ab: (value: TA) => TB,
    bc: (value: TB) => TC,
    cd: (value: TC) => TD,
    de: (value: TD) => TE
): TE;
export function pipe<TA, TB, TC, TD, TE, TF>(
    value: TA,
    ab: (value: TA) => TB,
    bc: (value: TB) => TC,
    cd: (value: TC) => TD,
    de: (value: TD) => TE,
    ef: (value: TE) => TF
): TF;
export function pipe<TA, TB, TC, TD, TE, TF, TG>(
    value: TA,
    ab: (value: TA) => TB,
    bc: (value: TB) => TC,
    cd: (value: TC) => TD,
    de: (value: TD) => TE,
    ef: (value: TE) => TF,
    fg: (value: TF) => TG
): TG;
export function pipe(value: unknown, ...fns: readonly ((input: unknown) => unknown)[]): unknown {
    let acc = value;
    for (const fn of fns) {
        acc = fn(acc);
    }
    return acc;
}
