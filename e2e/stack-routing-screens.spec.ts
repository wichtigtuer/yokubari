import { dispatchInput, expect, freezeForSnapshot, getState, gotoTestMode, stepFrames, test } from './base-fixtures';
import type { Page } from '@playwright/test';

const OVERFLOW_SEED = 1;
const MAX_CHUNKS = 60;
const STEP_CHUNK = 120;

const overlay = (page: Page): ReturnType<Page['locator']> => page.locator('#screens .screen-overlay');

test('title screen matches the baseline @snapshot', async ({ page }) => {
    await gotoTestMode(page);
    await freezeForSnapshot(page);
    await expect(overlay(page)).toHaveScreenshot('title-screen.png');
});

test('menu screen matches the baseline @snapshot', async ({ page }) => {
    await gotoTestMode(page);
    await dispatchInput(page, 'start');
    await freezeForSnapshot(page);
    await expect(overlay(page)).toHaveScreenshot('menu-screen.png');
});

test('pause overlay matches the baseline @snapshot', async ({ page }) => {
    await gotoTestMode(page);
    await dispatchInput(page, 'start');
    await dispatchInput(page, 'start');
    await dispatchInput(page, 'start');
    await dispatchInput(page, 'start');
    await freezeForSnapshot(page);
    await expect(overlay(page)).toHaveScreenshot('pause-screen.png');
});

test('game-over screen matches the baseline @snapshot', async ({ page }) => {
    await gotoTestMode(page, OVERFLOW_SEED);
    await dispatchInput(page, 'start');
    await dispatchInput(page, 'start');
    await dispatchInput(page, 'start');
    await dispatchInput(page, 'soft-drop-on');

    // Act: unattended play piles up until a landing overflows a tray
    let state = await getState(page);
    for (let chunk = 0; chunk < MAX_CHUNKS && state.phase !== 'game-over'; chunk += 1) {
        state = await stepFrames(page, STEP_CHUNK);
    }
    expect(state.phase).toBe('game-over');

    await freezeForSnapshot(page);
    await expect(overlay(page)).toHaveScreenshot('game-over-screen.png');
});
