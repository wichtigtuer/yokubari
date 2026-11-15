import type { BoardState, Monster, StackItem } from '../contracts/types';
import type { GameConfig } from '../contracts/config';
import type { Rng } from '../utils/random';
import { heightOf } from './board';
import { nextInt } from '../utils/random';

const MONSTER_KINDS: readonly Monster[] = ['m0', 'm1', 'm2', 'm3'];

/**
 * Builds one prefill column of even-length single-kind runs: feeding the matching kind always
 * annihilates a run from the top down, so every prefill is solvable by construction (spec §12.2).
 */
function buildColumn(rng: Rng, runs: number, config: GameConfig): StackItem[] {
    const items: StackItem[] = [];
    for (let run = 0; run < runs; run += 1) {
        const kind = MONSTER_KINDS[nextInt(rng, MONSTER_KINDS.length)];
        for (let cell = 0; cell < config.prefillRunHeight; cell += 1) {
            items.push(kind);
        }
    }
    return items;
}

/**
 * Generates the stage-start field for a level (spec §12.2): each column carries ceil(level /
 * runHeight) runs, so levels 1–5 start at roughly 1–5 rows. Kinds come from the seeded RNG, so a
 * stage is exactly reproducible from its seed.
 */
export function generatePrefill(rng: Rng, level: number, config: GameConfig): readonly StackItem[][] {
    const runsPerColumn = Math.ceil(level / config.prefillRunHeight);
    const columns: StackItem[][] = [];
    for (let column = 0; column < config.columns; column += 1) {
        columns.push(buildColumn(rng, runsPerColumn, config));
    }
    return columns;
}

/** A stage is cleared only when every stack is empty and nothing is falling or pending (spec §14 step 9). */
export function isStageCleared(board: BoardState): boolean {
    const stacksEmpty = board.columns.every((column) => heightOf(column) === 0);
    return stacksEmpty && board.falling.length === 0 && board.pending.length === 0;
}

/** Bonus for the stage just cleared; stage numbers above the table clamp to its last row. */
export function stageBonus(stageNumber: number, config: GameConfig): number {
    const row = Math.min(Math.max(stageNumber, 1), config.stageBonuses.length) - 1;
    return config.stageBonuses[row];
}
