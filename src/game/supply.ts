import type { BoardState, Falling, StackItem } from '../contracts/types';
import type { GameConfig } from '../contracts/config';
import { topOf } from './board';

function totalObjects(board: BoardState): number {
    let total = 0;
    for (const column of board.columns) {
        total += column.length;
    }
    return total;
}

/** True when a base half sits under monsters — a cap would hatch them all (spec §9). */
function hasBuriedBase(column: readonly StackItem[]): boolean {
    return column.includes('base') && column[column.length - 1] !== 'base';
}

/** The kinds that clear at least one exposed stack top (spec §4 [M/D]). */
function neededKinds(board: BoardState): Falling[] {
    const kinds = new Set<Falling>();
    for (const column of board.columns) {
        const top = topOf(column);
        if (top.type === 'some') {
            kinds.add(top.value);
        }
        if (hasBuriedBase(column)) {
            kinds.add('cap');
        }
    }
    return [...kinds];
}

/**
 * Adapts the spawn distribution to a nearly-finished board (spec §4 [M/D]): at or below the
 * threshold only kinds that clear exposed tops are supplied — a matching monster for a monster
 * top, `base` for a base top, `cap` when a base sits under monsters. Above the threshold, or
 * when nothing needs clearing, the configured defaults apply.
 */
export function adaptWeights(board: BoardState, config: GameConfig): readonly (readonly [Falling, number])[] {
    if (totalObjects(board) > config.adaptThreshold) {
        return config.typeWeights;
    }
    const adapted = config.typeWeights.filter(([kind]) => neededKinds(board).includes(kind));
    if (adapted.length === 0) {
        return config.typeWeights;
    }
    return adapted;
}
