import type { Monster, StackItem } from '../contracts/types';
import type { GameConfig } from '../contracts/config';
import type { Rng } from '../utils/random';
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
