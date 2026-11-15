import type { BoardState, ColumnIndex, CursorPair, ObjectId } from '../contracts/types';
import type { GameConfig } from '../contracts/config';

/** The board after a tray swap plus the ids of falling objects the swap carried across. */
export type SwapResult = Readonly<{ board: BoardState; carried: readonly ObjectId[] }>;

const LEFT_COLUMN: Readonly<Record<CursorPair, ColumnIndex>> = { 0: 0, 1: 1, 2: 2 };
const RIGHT_COLUMN: Readonly<Record<CursorPair, ColumnIndex>> = { 0: 1, 1: 2, 2: 3 };

/**
 * Exchanges the two whole stacks under the cursor pair, preserving internal order (spec §6);
 * empty columns exchange emptiness like any other content. Non-adjacent pairs are
 * unrepresentable: `CursorPair` only names adjacent pairs, so T14 holds by construction.
 */
export function swapTrays(board: BoardState, pairIndex: CursorPair, _config: GameConfig): SwapResult {
    const leftIndex = LEFT_COLUMN[pairIndex];
    const rightIndex = RIGHT_COLUMN[pairIndex];
    const columns = board.columns.map((column, index) => {
        if (index === leftIndex) {
            return board.columns[rightIndex];
        }
        if (index === rightIndex) {
            return board.columns[leftIndex];
        }
        return column;
    });
    return { board: { ...board, columns }, carried: [] };
}
