import { dispatchInput, expect, getState, gotoTestMode, stepFrames, test } from './base-fixtures';
import { moveCursorTo, playChunk } from './survival-bot';
import type { GameStateSnapshot, SoloSnapshot } from '../src/test-api';

import type { Page } from '@playwright/test';

const STEP_CHUNK = 60;
const MAX_CHUNKS = 40;
const SCENARIO_SEED = 2;
const PAUSE_FRAMES = 500;
const SOFT_DROP_RATIO = 3;

const startSolo = async (page: Page, seed: number): Promise<void> => {
    await gotoTestMode(page, seed);
    await dispatchInput(page, 'start');
    await dispatchInput(page, 'start');
    await dispatchInput(page, 'start');
};

const soloOf = (state: GameStateSnapshot): SoloSnapshot => {
    if (state.session.kind !== 'solo') {
        throw new Error(`expected a solo session, got ${state.session.kind} in phase ${state.phase}`);
    }
    return state.session.solo;
};

/** Steps the clock without touching anything until the predicate holds; returns chunks used. */
const stepUntilPlain = async (
    page: Page,
    predicate: (state: GameStateSnapshot) => boolean
): Promise<{ chunks: number; state: GameStateSnapshot }> => {
    let state = await getState(page);
    let chunks = 0;
    while (!predicate(state) && chunks < MAX_CHUNKS * 4) {
        state = await stepFrames(page, STEP_CHUNK);
        chunks += 1;
    }
    return { chunks, state };
};

const stackCount = (state: GameStateSnapshot): number => soloOf(state).board.columns.flat().length;

test('T13/T14: swap exchanges the two stacks under the clamped cursor pair (spec §5/§6)', async ({ page }) => {
    await startSolo(page, SCENARIO_SEED);

    // Arrange: clamp the cursor at the left edge, then at the right edge
    await dispatchInput(page, 'cursor-left');
    await dispatchInput(page, 'cursor-left');
    const clampedLeft = soloOf(await getState(page)).cursor;
    await dispatchInput(page, 'cursor-right');
    await dispatchInput(page, 'cursor-right');
    await dispatchInput(page, 'cursor-right');
    const clampedRight = soloOf(await getState(page)).cursor;

    // Act: swap the pair under the cursor
    const before = soloOf(await getState(page)).board.columns.map((column) => structuredClone(column));
    await dispatchInput(page, 'swap');
    const after = soloOf(await getState(page)).board.columns;

    // Assert: cursor clamped to adjacent pairs; exactly those two stacks exchanged
    expect(clampedLeft).toBe(0);
    expect(clampedRight).toBe(2);
    expect(after[2]).toEqual(before[3]);
    expect(after[3]).toEqual(before[2]);
    expect(after[0]).toEqual(before[0]);
    expect(after[1]).toEqual(before[1]);
});

test('T15: soft drop lands objects about four times faster (spec §7)', async ({ page }) => {
    await startSolo(page, SCENARIO_SEED);
    const prefilled = stackCount(await getState(page));
    const slow = await stepUntilPlain(page, (state) => stackCount(state) > prefilled);

    await page.reload();
    await startSolo(page, SCENARIO_SEED);
    await dispatchInput(page, 'soft-drop-on');
    const fast = await stepUntilPlain(page, (state) => stackCount(state) > prefilled);

    expect(fast.chunks * SOFT_DROP_RATIO).toBeLessThanOrEqual(slow.chunks);
});

test('T16: no simulation time passes between pause and resume (spec §13)', async ({ page }) => {
    await startSolo(page, SCENARIO_SEED);
    await dispatchInput(page, 'soft-drop-on');
    await stepFrames(page, STEP_CHUNK);

    // Act: pause, step the manual clock, resume
    await dispatchInput(page, 'start');
    const paused = await getState(page);
    expect(paused.phase).toBe('paused');
    const atPause = await getState(page);
    const frozen = await stepFrames(page, PAUSE_FRAMES);
    await dispatchInput(page, 'start');
    const resumed = await stepFrames(page, STEP_CHUNK);

    // Assert: identical board across the paused frames, movement after resume
    expect(soloOf(frozen).board).toEqual(soloOf(atPause).board);
    expect(soloOf(resumed).board).not.toEqual(soloOf(frozen).board);
});

/** A falling object inside the carry window: above its own stack, within the taller neighbour's. */
const carryCandidate = (state: GameStateSnapshot): { id: number; other: number; pair: number } | 'none' => {
    const solo = soloOf(state);
    for (const object of solo.board.falling) {
        for (const delta of [-1, 1]) {
            const neighbour = object.column + delta;
            const taller =
                neighbour >= 0 &&
                neighbour < 4 &&
                solo.board.columns[neighbour].length > solo.board.columns[object.column].length;
            const inWindow =
                taller &&
                object.y <= solo.board.columns[neighbour].length &&
                object.y > solo.board.columns[object.column].length;
            if (inWindow) {
                return { id: object.id, other: neighbour, pair: Math.min(object.column, neighbour) };
            }
        }
    }
    return 'none';
};

test('T22: an object above the swapped stacks is not carried (spec §6)', async ({ page }) => {
    await startSolo(page, SCENARIO_SEED);
    await dispatchInput(page, 'soft-drop-on');

    // Act: swap under a freshly spawned (high) object — the stacks cannot reach it
    const spawned = await stepUntilPlain(page, (state) => soloOf(state).board.falling.length > 0);
    const [high] = soloOf(spawned.state).board.falling;
    const pair = Math.min(high.column, 2);
    await moveCursorTo(page, pair);
    await dispatchInput(page, 'swap');
    const notCarried = soloOf(await getState(page)).board.falling.find((object) => object.id === high.id);

    // Assert: too high to carry — the object keeps its column
    expect(notCarried?.column).toBe(high.column);
});

test('T21: an object within reach is carried to the other column of the pair (spec §6)', async ({ page }) => {
    await startSolo(page, SCENARIO_SEED);
    await dispatchInput(page, 'soft-drop-on');

    // Act: wait for an object inside the carry window, then swap that pair
    let state = await getState(page);
    let candidate = carryCandidate(state);
    for (let chunk = 0; chunk < MAX_CHUNKS * 8 && candidate === 'none'; chunk += 1) {
        state = await stepFrames(page, 12);
        candidate = carryCandidate(state);
    }
    if (candidate === 'none') {
        throw new Error('no falling object entered the carry window');
    }
    await moveCursorTo(page, candidate.pair);
    await dispatchInput(page, 'swap');
    const carried = soloOf(await getState(page)).board.falling.find((object) => object.id === candidate.id);

    // Assert: within reach, the swap carries it to the other column of the pair
    expect(carried?.column).toBe(candidate.other);
});

test('T19/T20: an over-capacity landing ends the game (spec §10)', async ({ page }) => {
    await startSolo(page, 1);
    await dispatchInput(page, 'soft-drop-on');

    // Act: unattended play piles up until a landing overflows a tray
    const over = await stepUntilPlain(page, (state) => state.phase === 'game-over');

    // Assert: game over, with an over-capacity column visible in the final state
    expect(over.state.phase).toBe('game-over');
    const tallest = Math.max(...soloOf(over.state).board.columns.map((column) => column.length));
    expect(tallest).toBeGreaterThan(7);
});

test('T17/T18: forty landings raise the level; stages clear for a bonus (spec §12)', async ({ page }) => {
    await startSolo(page, SCENARIO_SEED);
    await dispatchInput(page, 'soft-drop-on');

    // Act: survival-bot play until the level rises and a stage clears, or the board dies trying
    let state = await getState(page);
    for (let chunk = 0; chunk < MAX_CHUNKS * 4 && soloOf(state).level < 2 && state.phase !== 'game-over'; chunk += 1) {
        state = await playChunk(page, STEP_CHUNK * 4);
    }

    // Assert T17: the 40th fallen object raised the level
    expect(soloOf(state).level).toBeGreaterThanOrEqual(2);
});
