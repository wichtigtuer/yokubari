/** Successful outcome of a fallible operation, carrying the produced value. */
export type Ok<TValue> = Readonly<{ type: 'ok'; value: TValue }>;

/** Failed outcome of a fallible operation, carrying a typed error reason. */
export type Err<TError> = Readonly<{ type: 'error'; error: TError }>;

/** Outcome of a fallible operation: either a success value or a typed error. */
export type Result<TValue, TError> = Ok<TValue> | Err<TError>;

/** Present variant of {@link Option}, carrying the value. */
export type Some<TValue> = Readonly<{ type: 'some'; value: TValue }>;

/** Absent variant of {@link Option}. */
export type None = Readonly<{ type: 'none' }>;

/** Optional value without null or undefined: either present or absent. */
export type Option<TValue> = Some<TValue> | None;

/** Wraps a value in a successful {@link Result}. */
export function ok<TValue>(value: TValue): Result<TValue, never> {
    return { type: 'ok', value };
}

/** Wraps an error reason in a failed {@link Result}. */
export function err<TError>(error: TError): Result<never, TError> {
    return { error, type: 'error' };
}

/** Wraps a value in a present {@link Option}. */
export function some<TValue>(value: TValue): Option<TValue> {
    return { type: 'some', value };
}

/** Returns the absent {@link Option}. */
export function none(): Option<never> {
    return { type: 'none' };
}

/** Transforms the success value of a {@link Result}; errors pass through untouched. */
export function mapResult<TValue, TNext, TError>(
    fn: (value: TValue) => TNext
): (result: Result<TValue, TError>) => Result<TNext, TError> {
    return (result: Result<TValue, TError>): Result<TNext, TError> => {
        if (result.type === 'error') {
            return result;
        }
        return ok(fn(result.value));
    };
}

/** Chains a fallible step onto a {@link Result}; errors short-circuit. */
export function flatMapResult<TValue, TNext, TError>(
    fn: (value: TValue) => Result<TNext, TError>
): (result: Result<TValue, TError>) => Result<TNext, TError> {
    return (result: Result<TValue, TError>): Result<TNext, TError> => {
        if (result.type === 'error') {
            return result;
        }
        return fn(result.value);
    };
}
