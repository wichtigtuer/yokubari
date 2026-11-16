import type { BoardState, PendingObject, Phase } from './contracts/types';
import type { AppBase } from 'playcanvas';

/** What the test API reports about the solo board. */
export type SoloSnapshot = Readonly<{
    board: BoardState;
    cursor: number;
    hatched: number;
    level: number;
    score: number;
    stage: number;
}>;

/** What the test API reports about one versus side. */
export type SideSnapshot = Readonly<{
    board: BoardState;
    hatched: number;
    level: number;
    pendingAttack: readonly PendingObject[];
    score: number;
}>;

/** The running session: a solo game, a versus match, or none before the menu is confirmed. */
export type SessionSnapshot =
    | Readonly<{ kind: 'solo'; solo: SoloSnapshot }>
    | Readonly<{
          kind: 'versus';
          left: SideSnapshot;
          right: SideSnapshot;
          round: number;
          tokens: Readonly<{ left: number; right: number }>;
      }>
    | Readonly<{ kind: 'none' }>;

/** A clone of the observable game state: safe to assert on, never aliases live state. */
export type GameStateSnapshot = Readonly<{
    frameIndex: number;
    phase: Phase;
    session: SessionSnapshot;
}>;

/** The handle `src/main.ts` gives the test API: everything the manual clock needs. */
export interface TestShell {
    dispatch: (action: string) => void;
    isPlaying: () => boolean;
    phase: () => Phase;
    snapshot: () => SessionSnapshot;
    step: () => void;
}

export interface PcTestApi {
    dispatchInput: (input: string) => GameStateSnapshot;
    freezeForSnapshot: () => GameStateSnapshot;
    getState: () => GameStateSnapshot;
    stepFrames: (frames: number) => GameStateSnapshot;
}

declare global {
    interface Window {
        __pcTestApi?: PcTestApi;
    }
}

/**
 * Attaches `window.__pcTestApi`, the browser-facing test surface Playwright drives through
 * `e2e/base-fixtures.ts`. Only call this in test mode: it freezes the real-time clock
 * (`app.timeScale = 0`) so the simulation advances exclusively through `stepFrames()`.
 */
export const attachTestApi = (app: AppBase, shell: TestShell): void => {
    app.timeScale = 0;

    // Logical ticks applied through the manual clock; render-only rAF frames do not move this
    let frameIndex = 0;

    // Always return a fresh clone so test code cannot mutate live state
    const getState = (): GameStateSnapshot => ({
        frameIndex,
        phase: shell.phase(),
        session: structuredClone(shell.snapshot())
    });

    window.__pcTestApi = {
        dispatchInput: (input: string): GameStateSnapshot => {
            shell.dispatch(input);
            return getState();
        },
        freezeForSnapshot: (): GameStateSnapshot => {
            // The scene is already static under the frozen clock; request a fresh frame so the
            // Captured canvas is current
            app.renderNextFrame = true;
            return getState();
        },
        getState,
        stepFrames: (frames: number): GameStateSnapshot => {
            for (let tick = 0; tick < frames; tick += 1) {
                if (shell.isPlaying()) {
                    shell.step();
                }
                frameIndex += 1;
            }
            app.renderNextFrame = true;
            return getState();
        }
    };
};
