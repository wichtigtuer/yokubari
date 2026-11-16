import './starter.css';
import type { AppElement, EntityElement } from '@playcanvas/web-components';
import { createShell, dispatchAction, step } from './shell/session';
import { GAME_CONFIG } from './contracts/config';
import type { Phase } from './contracts/types';
import type { Shell } from './shell/session';
import type { VersusState } from './game/versus';
import { attachInput } from './input';
import { dispatchCommand } from './shell/commands';
import { sessionSnapshot } from './shell/snapshot';
import { syncBoardView } from './render/board-view';
import { whenReady } from '@playcanvas/web-components';

// Logical ticks per second; the frame loop accumulates real time into fixed steps
const FIXED_DT = 1 / 60;

/** The DOM and scene roots the renderer writes to. */
type ViewRefs = Readonly<{ hud: HTMLElement; left: HTMLElement; right: HTMLElement; solo: HTMLElement }>;

/** Shows the versus roots and syncs both boards; the HUD shows the match score. */
function renderVersus(versus: VersusState, shell: Shell, view: ViewRefs): void {
    view.solo.setAttribute('enabled', 'false');
    view.left.setAttribute('enabled', 'true');
    view.right.setAttribute('enabled', 'true');
    if (shell.dirty) {
        syncBoardView(view.left, versus.left.board, GAME_CONFIG);
        syncBoardView(view.right, versus.right.board, GAME_CONFIG);
    }
    view.hud.textContent = `Round ${versus.round} — tokens ${versus.tokens.left} : ${versus.tokens.right}`;
}

/** Shows the solo root and syncs the board; the HUD shows score, level and hatched count. */
function renderSolo(shell: Shell, view: ViewRefs): void {
    view.solo.setAttribute('enabled', 'true');
    view.left.setAttribute('enabled', 'false');
    view.right.setAttribute('enabled', 'false');
    if (shell.dirty) {
        syncBoardView(view.solo, shell.board, GAME_CONFIG);
    }
    view.hud.textContent = `Score ${shell.score.score} — Level ${shell.progression.level} — Hatched ${shell.score.hatched}`;
}

/** Syncs the rendered entities and the HUD text from the current state (read-only render). */
function render(shell: Shell, view: ViewRefs): void {
    if (shell.versus.type === 'some') {
        renderVersus(shell.versus.value, shell, view);
    } else {
        renderSolo(shell, view);
    }
    shell.dirty = false;
}

/** The #hud overlay root, created if the page somehow lacks it. */
function requireHud(): HTMLElement {
    const existing = document.querySelector('#hud');
    if (existing instanceof HTMLElement) {
        return existing;
    }
    const created = document.createElement('div');
    created.id = 'hud';
    document.body.append(created);
    return created;
}

/** A fixed seed in test mode keeps replays deterministic; real games seed from the clock. */
function selectSeed(isTestMode: boolean): number {
    if (isTestMode) {
        return 1337;
    }
    return Date.now();
}

const appElement = await whenReady<AppElement>('pc-app');
const [solo, left, right] = await Promise.all([
    whenReady<EntityElement>('pc-entity[name="board-root-solo"]'),
    whenReady<EntityElement>('pc-entity[name="board-root-left"]'),
    whenReady<EntityElement>('pc-entity[name="board-root-right"]')
]);
const hud = requireHud();

// Test mode: ?test=1 on a dev server started with VITE_TEST_MODE=1 exposes window.__pcTestApi
const testMode = new URLSearchParams(globalThis.location.search).get('test') === '1';
const shell = createShell(selectSeed(testMode));
const view: ViewRefs = { hud, left, right, solo };

attachInput(globalThis.window, {
    onAction: (action) => {
        dispatchAction(shell, action);
    },
    onSoftDrop: (active) => {
        shell.softDrop = active;
    }
});

let accumulator = 0;
appElement.app?.on('update', (dt: number) => {
    if (shell.app.phase === 'playing') {
        accumulator += dt;
        while (accumulator >= FIXED_DT) {
            step(shell);
            accumulator -= FIXED_DT;
        }
    }
    render(shell, view);
});

// Playwright drives the game through window.__pcTestApi — a manual clock plus state and input
// Access for deterministic replay tests. Production builds never attach it.
if (import.meta.env.DEV && import.meta.env.VITE_TEST_MODE === '1' && testMode && appElement.app) {
    const { attachTestApi } = await import('./test-api');
    const { app } = appElement;
    attachTestApi(app, {
        dispatch: (input) => {
            dispatchCommand(shell, input);
            render(shell, view);
        },
        isPlaying: () => shell.app.phase === 'playing',
        phase: (): Phase => shell.app.phase,
        snapshot: () => sessionSnapshot(shell),
        step: () => {
            step(shell);
            render(shell, view);
        }
    });
}
