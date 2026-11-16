import type { Falling, StackItem } from '../contracts/types';
import type { GameConfig, HatchTier } from '../contracts/config';
import { dropTop, pushItem, topOf } from './board';
import { resolveCap } from './egg';

/** Exactly one outcome of a falling object meeting a stack (spec §8/§9). */
export type LandingOutcome =
    | Readonly<{ type: 'stacked'; column: readonly StackItem[] }>
    | Readonly<{ type: 'pair-cleared'; column: readonly StackItem[]; points: number }>
    | Readonly<{ type: 'cap-vanished' }>
    | Readonly<{ type: 'hatched'; column: readonly StackItem[]; enclosed: number; tier: HatchTier; points: number }>;

/** Points for an annihilated pair: base halves and monsters score independently (spec §8). */
function pairScore(kind: Exclude<Falling, 'cap'>, config: GameConfig): number {
    if (kind === 'base') {
        return config.basePairScore;
    }
    return config.monsterPairScore;
}

/**
 * Resolves a landing object against the stack top (spec §8): a monster on the same monster or a
 * base half on a base half annihilates the pair for points; anything else stacks. Cap halves are
 * resolved by the egg branch. Only the top is ever compared — buried matches are unreachable.
 */
export function resolveLanding(column: readonly StackItem[], incoming: Falling, config: GameConfig): LandingOutcome {
    if (incoming === 'cap') {
        return resolveCap(column, config);
    }
    const top = topOf(column);
    if (top.type === 'some' && top.value === incoming) {
        return { column: dropTop(column), points: pairScore(incoming, config), type: 'pair-cleared' };
    }
    return { column: pushItem(column, incoming), type: 'stacked' };
}
