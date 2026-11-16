import type { BoardState, ColumnIndex, CursorPair, FallingObject, ObjectId } from '../contracts/types';
import type { GameConfig } from '../contracts/config';
import { heightOf } from './board';

/** The board after a tray swap plus the ids of falling objects the swap carried across. */
export type SwapResult = Readonly<{ board: BoardState; carried: readonly ObjectId[] }>;

const LEFT_COLUMN: Readonly<Record<CursorPair, ColumnIndex>> = { 0: 0, 1: 1, 2: 2 };
const RIGHT_COLUMN: Readonly<Record<CursorPair, ColumnIndex>> = { 0: 1, 1: 2, 2: 3 };

/** Applies the configured carry comparison operator (spec §17 keeps it tunable). */
function reaches(reach: number, altitude: number, operator: GameConfig['swapCarryOperator']): boolean {
    if (operator === '>') {
        return reach > altitude;
    }
    return reach >= altitude;
}

/** The carry rule (spec §6): a falling object is carried iff either swapped stack reaches it. */
function isCarried(
    object: FallingObject,
    leftIndex: ColumnIndex,
    rightIndex: ColumnIndex,
    reach: number,
    config: GameConfig
): boolean {
    const inPair = object.column === leftIndex || object.column === rightIndex;
    return inPair && reaches(reach, object.y, config.swapCarryOperator);
}

/** Moves a carried object to the other column of the swapped pair. */
function carryAcross(object: FallingObject, leftIndex: ColumnIndex, rightIndex: ColumnIndex): FallingObject {
    if (object.column === leftIndex) {
        return { ...object, column: rightIndex };
    }
    return { ...object, column: leftIndex };
}

/**
 * Exchanges the two whole stacks under the cursor pair, preserving internal order (spec §6);
 * empty columns exchange emptiness like any other content. Non-adjacent pairs are
 * unrepresentable: `CursorPair` only names adjacent pairs, so T14 holds by construction.
 */
export function swapTrays(board: BoardState, pairIndex: CursorPair, config: GameConfig): SwapResult {
    const leftIndex = LEFT_COLUMN[pairIndex];
    const rightIndex = RIGHT_COLUMN[pairIndex];
    const reach = Math.max(heightOf(board.columns[leftIndex]), heightOf(board.columns[rightIndex]));
    const columns = board.columns.map((column, index) => {
        if (index === leftIndex) {
            return board.columns[rightIndex];
        }
        if (index === rightIndex) {
            return board.columns[leftIndex];
        }
        return column;
    });
    const carried: ObjectId[] = [];
    const falling = board.falling.map((object) => {
        if (isCarried(object, leftIndex, rightIndex, reach, config)) {
            carried.push(object.id);
            return carryAcross(object, leftIndex, rightIndex);
        }
        return object;
    });
    return { board: { ...board, columns, falling }, carried };
}
