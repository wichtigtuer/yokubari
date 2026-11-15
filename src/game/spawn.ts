import type { ColumnIndex, Falling } from '../contracts/types';
import { err, ok } from '../utils/result';
import { nextInt, weightedChoice } from '../utils/random';
import type { GameConfig } from '../contracts/config';
import type { Result } from '../utils/result';
import type { Rng } from '../utils/random';

/** One object of a batch: what falls, in which column, and after how many ticks it enters. */
export type SpawnedObject = Readonly<{ column: ColumnIndex; kind: Falling; spawnDelay: number }>;

/** A set of objects entering the board together, staggered in time. */
export type Batch = Readonly<{ objects: readonly SpawnedObject[] }>;

/** Reason a batch cannot be generated. */
export type SpawnError = Readonly<{ reason: 'invalid-size'; size: number }> | Readonly<{ reason: 'type-weights' }>;

const ALL_COLUMNS: readonly ColumnIndex[] = [0, 1, 2, 3];
const MIN_BATCH_SIZE = 1;

/** Draws `size` distinct columns without replacement from the board's columns. */
function drawColumns(rng: Rng, columnCount: number, size: number): ColumnIndex[] {
    const available = ALL_COLUMNS.slice(0, columnCount);
    const drawn: ColumnIndex[] = [];
    for (let count = 0; count < size; count += 1) {
        const pick = nextInt(rng, available.length);
        drawn.push(available[pick]);
        available.splice(pick, 1);
    }
    return drawn;
}

/**
 * Generates a batch of `size` objects (spec §4): kinds drawn from the configured weights, columns
 * pairwise distinct and drawn without replacement, entry delays strictly increasing by the
 * configured stagger. Ids are not assigned here — objects get one when they enter the field.
 */
export function generateBatch(rng: Rng, config: GameConfig, size: number): Result<Batch, SpawnError> {
    if (size < MIN_BATCH_SIZE || size > config.columns) {
        return err({ reason: 'invalid-size', size });
    }
    const columns = drawColumns(rng, config.columns, size);
    const objects: SpawnedObject[] = [];
    for (let index = 0; index < size; index += 1) {
        const choice = weightedChoice(rng, config.typeWeights);
        if (choice.type === 'error') {
            return err({ reason: 'type-weights' });
        }
        objects.push({ column: columns[index], kind: choice.value, spawnDelay: index * config.spawnStaggerTicks });
    }
    return ok({ objects });
}
