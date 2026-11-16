import type { Falling, StackItem } from '../contracts/types';
import type { GameConfig } from '../contracts/config';
import type { LandingOutcome } from './resolve';
import { resolveLanding } from './resolve';

/** A landing fully resolved: what happened, and whether it ended the game (spec §10). */
export type LandedResult = Readonly<{ gameOver: boolean; outcome: LandingOutcome }>;

/**
 * Whether the resolved outcome leaves the column taller than the stack capacity (spec §10).
 * Resolution runs first: a pair clear or hatch on a full column never overflows.
 */
export function causesOverflow(column: readonly StackItem[], outcome: LandingOutcome, config: GameConfig): boolean {
    if (outcome.type === 'cap-vanished') {
        return column.length > config.stackCapacity;
    }
    return outcome.column.length > config.stackCapacity;
}

/** Single entry point for a falling object meeting a column: resolve, then check overflow. */
export function landObject(column: readonly StackItem[], incoming: Falling, config: GameConfig): LandedResult {
    const outcome = resolveLanding(column, incoming, config);
    return { gameOver: causesOverflow(column, outcome, config), outcome };
}
