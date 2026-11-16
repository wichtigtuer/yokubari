import type { BoardState, StackItem } from '../contracts/types';
import { none, some } from '../utils/result';
import type { Option } from '../utils/result';

/** A fresh board: four empty trays, nothing falling, no ticks elapsed. */
export function createEmptyBoard(): BoardState {
    return { columns: [[], [], [], []], fallAccumulator: 0, falling: [], nextObjectId: 0, pending: [] };
}

/** Number of objects resting in a tray stack. */
export function heightOf(column: readonly StackItem[]): number {
    return column.length;
}

/** The object on top of a tray stack, or none when the stack is empty. */
export function topOf(column: readonly StackItem[]): Option<StackItem> {
    if (column.length === 0) {
        return none();
    }
    return some(column[column.length - 1]);
}

/** Returns a new stack with the item placed on top; the input is never mutated. */
export function pushItem(column: readonly StackItem[], item: StackItem): StackItem[] {
    return [...column, item];
}

/** Returns a new stack without its top item; the input is never mutated. */
export function dropTop(column: readonly StackItem[]): StackItem[] {
    return column.slice(0, -1);
}
