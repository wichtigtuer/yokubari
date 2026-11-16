import { dispatchInput, expect, getState, gotoTestMode, stepFrames, test } from './base-fixtures';
import type { GameStateSnapshot } from '../src/test-api';

import type { Page } from '@playwright/test';

const STEP_CHUNK = 60;
const SCENARIO_SEED = 2;
const TOKENS_TO_WIN = 3;

type VersusSession = Extract<GameStateSnapshot['session'], { kind: 'versus' }>;

const startVersus = async (page: Page, seed: number): Promise<void> => {
    await gotoTestMode(page, seed);
    await dispatchInput(page, 'cursor-right');
    await dispatchInput(page, 'start');
    await dispatchInput(page, 'start');
    await dispatchInput(page, 'start');
    await dispatchInput(page, 'soft-drop-on');
};

const versusOf = (state: GameStateSnapshot): VersusSession => {
    if (state.session.kind !== 'versus') {
        throw new Error(`expected a versus session, got ${state.session.kind} in phase ${state.phase}`);
    }
    return state.session;
};

/** Steps in chunks until the predicate holds or the chunk budget runs out. */
const stepVersusUntil = async (
    page: Page,
    predicate: (state: GameStateSnapshot) => boolean,
    maxChunks: number
): Promise<GameStateSnapshot> => {
    let state = await getState(page);
    for (let chunk = 0; chunk < maxChunks && !predicate(state); chunk += 1) {
        state = await stepFrames(page, STEP_CHUNK);
    }
    return state;
};

test('T23: a hatched egg enqueues monster attacks against the opponent (spec §12.3)', async ({ page }) => {
    await startVersus(page, SCENARIO_SEED);

    // Act: play until a hatch sends an attack wave across
    const attacked = await stepVersusUntil(
        page,
        (state) => versusOf(state).left.pendingAttack.length > 0 || versusOf(state).right.pendingAttack.length > 0,
        150
    );

    // Assert: the attack queue carries monster objects with fixed kinds and columns
    const session = versusOf(attacked);
    const attack = [...session.left.pendingAttack, ...session.right.pendingAttack];
    expect(attack.length).toBeGreaterThan(0);
    expect(attack.every((object) => object.kind.startsWith('m'))).toBe(true);
});

test('T24/T25/T26: rounds award tokens and three tokens decide the match (spec §12.3)', async ({ page }) => {
    await startVersus(page, SCENARIO_SEED);

    // Act: play the match out — unattended boards overflow and feed each other tokens
    let sawNextRound = false;
    let state = await getState(page);
    for (let chunk = 0; chunk < 600 && state.phase !== 'match-result'; chunk += 1) {
        state = await stepFrames(page, STEP_CHUNK);
        if (state.session.kind === 'versus' && state.session.round > 1) {
            sawNextRound = true;
        }
        if (state.phase === 'game-over') {
            throw new Error('versus session unexpectedly reached solo game-over');
        }
    }

    // Assert: rounds restarted, tokens were awarded, the match ended at the token target
    expect(sawNextRound).toBe(true);
    expect(state.phase).toBe('match-result');
    const session = versusOf(state);
    expect(Math.max(session.tokens.left, session.tokens.right)).toBeGreaterThanOrEqual(TOKENS_TO_WIN);
});
