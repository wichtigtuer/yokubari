import { describe, expect, it } from 'vite-plus/test';

import { GAME_CONFIG } from '../contracts/config';
import { createRng } from '../utils/random';
import { generateBatch } from './spawn';

const STATISTICAL_DRAWS = 600;

describe('generateBatch shape (spec §4)', () => {
    it('produces the requested number of objects in pairwise distinct columns', () => {
        // Arrange / act
        const batch = generateBatch(createRng(42), GAME_CONFIG, GAME_CONFIG.batchSize);

        // Assert
        expect(batch.type).toBe('ok');
        if (batch.type === 'ok') {
            const columns = batch.value.objects.map((object) => object.column);
            expect(batch.value.objects).toHaveLength(GAME_CONFIG.batchSize);
            expect(new Set(columns).size).toBe(columns.length);
        }
    });

    it('assigns strictly increasing spawn delays', () => {
        // Arrange / act
        const batch = generateBatch(createRng(42), GAME_CONFIG, GAME_CONFIG.levelUpBatchSize);

        // Assert
        expect(batch.type).toBe('ok');
        if (batch.type === 'ok') {
            const delays = batch.value.objects.map((object) => object.spawnDelay);
            expect(delays.every((delay, index) => index === 0 || delays[index - 1] < delay)).toBe(true);
        }
    });

    it('reproduces the same batch for the same seed', () => {
        // Arrange / act
        const first = generateBatch(createRng(7), GAME_CONFIG, GAME_CONFIG.batchSize);
        const second = generateBatch(createRng(7), GAME_CONFIG, GAME_CONFIG.batchSize);

        // Assert
        expect(second).toEqual(first);
    });
});

describe('generateBatch distribution and errors', () => {
    it('sees all six types across many objects under uniform weights', () => {
        // Arrange
        const rng = createRng(1234);
        const kinds = new Set<string>();
        const batches = Math.ceil(STATISTICAL_DRAWS / GAME_CONFIG.batchSize);

        // Act
        for (let count = 0; count < batches; count += 1) {
            const batch = generateBatch(rng, GAME_CONFIG, GAME_CONFIG.batchSize);
            if (batch.type === 'ok') {
                for (const object of batch.value.objects) {
                    kinds.add(object.kind);
                }
            }
        }

        // Assert
        expect(kinds).toEqual(new Set(['m0', 'm1', 'm2', 'm3', 'base', 'cap']));
    });

    it('rejects a size of zero and a size beyond the column count', () => {
        // Arrange / act
        const empty = generateBatch(createRng(1), GAME_CONFIG, 0);
        const tooWide = generateBatch(createRng(1), GAME_CONFIG, GAME_CONFIG.columns + 1);

        // Assert
        expect(empty).toEqual({ error: { reason: 'invalid-size', size: 0 }, type: 'error' });
        expect(tooWide.type).toBe('error');
    });

    it('surfaces misconfigured type weights as a typed error', () => {
        // Arrange
        const broken = { ...GAME_CONFIG, typeWeights: [] };

        // Act
        const batch = generateBatch(createRng(1), broken, GAME_CONFIG.batchSize);

        // Assert
        expect(batch).toEqual({ error: { reason: 'type-weights' }, type: 'error' });
    });
});
