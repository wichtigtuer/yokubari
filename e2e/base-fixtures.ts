import type { Page } from '@playwright/test';
import type { GameStateSnapshot } from '../src/test-api';
import type { ReplayFixture } from './replay-fixture';
import { test as baseTest } from '@playwright/test';
import { promises as fs, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

declare global {
    interface Window {
        __coverage__?: unknown;
        collectIstanbulCoverage?: (coverageJSON: string) => void;
    }
}

const istanbulCLIOutput = path.join(process.cwd(), '.nyc_output');

// Collect the istanbul coverage the dev server instruments into src/ (VITE_COVERAGE=true), writing
// One file per page into .nyc_output/ for `nyc report`
const test = baseTest.extend({
    context: async ({ context }, use) => {
        await context.addInitScript(() => {
            globalThis.addEventListener('beforeunload', () => {
                if (window.__coverage__ && window.collectIstanbulCoverage) {
                    window.collectIstanbulCoverage(JSON.stringify(window.__coverage__));
                }
            });
        });
        await fs.mkdir(istanbulCLIOutput, { recursive: true });
        await context.exposeFunction('collectIstanbulCoverage', (coverageJSON: string) => {
            if (coverageJSON) {
                writeFileSync(path.join(istanbulCLIOutput, `playwright_coverage_${randomUUID()}.json`), coverageJSON);
            }
        });
        await use(context);
        // Pages are drained sequentially: each writes its own coverage file
        for (const page of context.pages()) {
            await page.evaluate(() => {
                if (window.__coverage__ && window.collectIstanbulCoverage) {
                    window.collectIstanbulCoverage(JSON.stringify(window.__coverage__));
                }
            });
        }
    }
});

const { expect } = test;

/**
 * Test-mode entry point: `?test=1` freezes the real-time clock and attaches
 * `window.__pcTestApi` (see `src/test-api.ts`).
 */
const gotoTestMode = async (page: Page, seed?: number): Promise<void> => {
    const url = seed === undefined ? '/?test=1' : `/?test=1&seed=${seed}`;
    await page.goto(url);
    await page.waitForFunction(() => Boolean(window.__pcTestApi));
};

/** Advance the simulation by `frames` logical ticks on the manual clock. */
const stepFrames = async (page: Page, frames: number): Promise<GameStateSnapshot> => {
    const state = await page.evaluate((count) => window.__pcTestApi?.stepFrames(count), frames);
    if (!state) {
        throw new Error('__pcTestApi is not attached; call gotoTestMode(page) first');
    }
    return state;
};

/** Normalise and apply a raw input string through the test API. */
const dispatchInput = async (page: Page, input: string): Promise<GameStateSnapshot> => {
    const state = await page.evaluate((action) => window.__pcTestApi?.dispatchInput(action), input);
    if (!state) {
        throw new Error('__pcTestApi is not attached; call gotoTestMode(page) first');
    }
    return state;
};

/** Read a clone of the current test state. */
const getState = async (page: Page): Promise<GameStateSnapshot> => {
    const state = await page.evaluate(() => window.__pcTestApi?.getState());
    if (!state) {
        throw new Error('__pcTestApi is not attached; call gotoTestMode(page) first');
    }
    return state;
};

/** Present a fresh frame of the static scene before a screenshot assertion. */
const freezeForSnapshot = async (page: Page): Promise<void> => {
    await page.evaluate(() => window.__pcTestApi?.freezeForSnapshot());
};

/** Enter test mode and feed a replay fixture's input/tick steps through the manual clock. */
const runReplay = async (page: Page, fixture: ReplayFixture): Promise<GameStateSnapshot> => {
    await gotoTestMode(page);
    for (const step of fixture.steps) {
        if (step.input !== undefined) {
            await dispatchInput(page, step.input);
        }
        if (step.frames !== undefined) {
            await stepFrames(page, step.frames);
        }
    }
    return getState(page);
};

export { dispatchInput, expect, freezeForSnapshot, getState, gotoTestMode, runReplay, stepFrames, test };
