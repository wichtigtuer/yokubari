import { dispatchInput, expect, getState, gotoTestMode, test } from './base-fixtures';
import { playChunk } from './survival-bot';
import type { GameStateSnapshot, SoloSnapshot } from '../src/test-api';

import type { Page } from '@playwright/test';

// Soft drop quarter-speed lands the first batch in ~400 ticks; chunks keep the loop responsive
const STEP_CHUNK = 60;
const MAX_CHUNKS = 40;

// Seed 2 hatches early under survival-bot play; the suite stays on it for determinism
const SCENARIO_SEED = 2;

const startSolo = async (page: Page): Promise<void> => {
    await gotoTestMode(page, SCENARIO_SEED);
    await dispatchInput(page, 'start');
    await dispatchInput(page, 'start');
    await dispatchInput(page, 'start');
    await dispatchInput(page, 'soft-drop-on');
};

const soloOf = (state: GameStateSnapshot): SoloSnapshot => {
    if (state.session.kind !== 'solo') {
        throw new Error(`expected a solo session, got ${state.session.kind} in phase ${state.phase}`);
    }
    return state.session.solo;
};

const stackCount = (state: GameStateSnapshot): number => soloOf(state).board.columns.flat().length;

/** Plays chunk by chunk until the predicate holds, returning the last state read. */
const playUntil = async (page: Page, predicate: (state: GameStateSnapshot) => boolean): Promise<GameStateSnapshot> => {
    let state = await getState(page);
    for (let chunk = 0; chunk < MAX_CHUNKS && !predicate(state); chunk += 1) {
        if (state.phase === 'game-over') {
            throw new Error(`game over while playing; board ${JSON.stringify(soloOf(state).board.columns)}`);
        }
        state = await playChunk(page, STEP_CHUNK);
    }
    return state;
};

test('T1/T2: falling objects land on the trays and stack (spec §8)', async ({ page }) => {
    await startSolo(page);
    const initial = await getState(page);
    const prefilled = stackCount(initial);

    // Act: run the clock until at least one spawned object has landed
    const landed = await playUntil(page, (state) => stackCount(state) > prefilled);

    // Assert: stacks grew beyond the stage prefill
    expect(stackCount(landed)).toBeGreaterThan(prefilled);
});

test('T4/T6: pair clears and hatches raise the score (spec §9)', async ({ page }) => {
    await startSolo(page);

    // Act: play until the first scoring event
    const scored = await playUntil(page, (state) => soloOf(state).score > 0);

    // Assert
    expect(soloOf(scored).score).toBeGreaterThan(0);
});

test('T7: an egg hatches — base capped with monsters enclosed (spec §9)', async ({ page }) => {
    await startSolo(page);

    // Act: the survival bot steers caps onto base columns until one hatches
    const hatched = await playUntil(page, (state) => soloOf(state).hatched > 0);

    // Assert
    expect(soloOf(hatched).hatched).toBeGreaterThan(0);
});
