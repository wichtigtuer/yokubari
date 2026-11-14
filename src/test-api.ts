import type { AppBase, Entity } from 'playcanvas';

// Logical ticks per second under the manual clock
const TICKS_PER_SECOND = 60;

// One full second, so the tick length reads as a fraction of a second
const FULL_SECOND = 1;

// Decimal places reported for rotations: enough to assert on, past the per-engine ulp differences
// In trigonometry that would otherwise make snapshots browser-specific
const PRECISION = 6;

// Round to PRECISION decimals; the +0 also normalises the -0 quaternion conversion can produce
const round = (value: number): number => Number(value.toFixed(PRECISION)) + 0;

// Fixed tick length used by stepFrames(), so replays are deterministic regardless of wall time
export const FIXED_DT = FULL_SECOND / TICKS_PER_SECOND;

export interface TestState {
    direction: number;
    frameIndex: number;
    rotation: [number, number, number];
}

export interface PcTestApi {
    dispatchInput: (input: string) => TestState;
    freezeForSnapshot: () => TestState;
    getState: () => TestState;
    stepFrames: (frames: number) => TestState;
}

declare global {
    interface Window {
        __pcTestApi?: PcTestApi;
    }
}

interface TestApiOptions {
    app: AppBase;
    cube: Entity;
    getDirection: () => number;
    reverseDirection: () => void;
}

/**
 * Attach `window.__pcTestApi`, the browser-facing test surface Playwright drives through
 * `e2e/base-fixtures.ts`. Only call this in test mode: it freezes the real-time clock
 * (`app.timeScale = 0`) so the simulation advances exclusively through `stepFrames()`.
 */
export const attachTestApi = (options: TestApiOptions): void => {
    const { app, cube } = options;

    // Freeze the real-time clock: rAF frames still render but no longer advance the simulation
    app.timeScale = 0;

    // Real-time frames may have run before the clock froze; restart from a known orientation
    cube.setEulerAngles(0, 0, 0);

    // Logical ticks applied through the manual clock; render-only rAF frames do not move this
    let frameIndex = 0;

    // Always return a clone so test code cannot mutate live state
    const getState = (): TestState => {
        const euler = cube.getEulerAngles();
        return {
            direction: options.getDirection(),
            frameIndex,
            rotation: [round(euler.x), round(euler.y), round(euler.z)]
        };
    };

    window.__pcTestApi = {
        dispatchInput: (input: string): TestState => {
            // Normalise raw input strings into actions
            if (input === 'reverse') {
                options.reverseDirection();
            }
            return getState();
        },
        freezeForSnapshot: (): TestState => {
            // The scene is already static under the frozen clock; request a fresh frame so the
            // Canvas Playwright captures is current
            app.renderNextFrame = true;
            return getState();
        },
        getState,
        stepFrames: (frames: number): TestState => {
            for (let tick = 0; tick < frames; tick += 1) {
                app.update(FIXED_DT);
                frameIndex += 1;
            }
            app.renderNextFrame = true;
            return getState();
        }
    };
};
