import './starter.css';
import type { AppElement, EntityElement } from '@playcanvas/web-components';
import type { CursorPair, ObjectId, Phase } from './contracts/types';
import { advanceSwap, beginSwap, captureOrigins, swapElementNames } from './render/swap-animation';
import { createShell, dispatchAction, step } from './shell/session';
import { hudModel, renderHud } from './hud';
import { none, some } from './utils/result';
import { GAME_CONFIG } from './contracts/config';
import type { Option } from './utils/result';
import type { Shell } from './shell/session';
import type { SwapAnimation } from './render/swap-animation';
import { attachInput } from './input';
import { dispatchCommand } from './shell/commands';
import { sessionSnapshot } from './shell/snapshot';
import { syncBoardView } from './render/board-view';
import { whenReady } from '@playcanvas/web-components';

// Logical ticks per second; the frame loop accumulates real time into fixed steps
const FIXED_DT = 1 / 60;

/** The DOM and scene roots the renderer writes to. */
type ViewRefs = Readonly<{ hud: HTMLElement; left: HTMLElement; right: HTMLElement; solo: HTMLElement }>;

/** The board root the active session renders into (versus input drives the left board). */
function activeRoot(shell: Shell, view: ViewRefs): HTMLElement {
    if (shell.versus.type === 'some') {
        return view.left;
    }
    return view.solo;
}

/** Rebuilds the board entities of the active session from state. */
function syncBoards(shell: Shell, view: ViewRefs): void {
    if (shell.versus.type === 'some') {
        syncBoardView(view.left, shell.versus.value.left.board, GAME_CONFIG);
        syncBoardView(view.right, shell.versus.value.right.board, GAME_CONFIG);
        return;
    }
    syncBoardView(view.solo, shell.board, GAME_CONFIG);
}

/** The running swap tween, if any; swaps are debounced while it runs. */
let tween: Option<SwapAnimation> = none();

/** Starts the swap tween around a board sync, and locks further swaps until it finishes. */
function beginSwapTween(
    shell: Shell,
    view: ViewRefs,
    swap: Readonly<{ carried: readonly ObjectId[]; pair: CursorPair }>
): void {
    const root = activeRoot(shell, view);
    const origins = captureOrigins(root, swapElementNames(swap.pair, swap.carried, GAME_CONFIG.stackCapacity));
    syncBoards(shell, view);
    tween = some(beginSwap(root, origins));
    shell.swapLock = true;
    shell.lastSwap = none();
}

/** Syncs the boards, wrapping the sync in a swap tween when the last action was a swap. */
function renderBoards(shell: Shell, view: ViewRefs): void {
    const swap = shell.lastSwap;
    if (swap.type === 'none') {
        syncBoards(shell, view);
        return;
    }
    beginSwapTween(shell, view, swap.value);
}

/** Shows the versus roots and syncs both boards; the HUD shows the match score. */
function renderVersus(shell: Shell, view: ViewRefs): void {
    view.solo.setAttribute('enabled', 'false');
    view.left.setAttribute('enabled', 'true');
    view.right.setAttribute('enabled', 'true');
    if (shell.dirty) {
        renderBoards(shell, view);
    }
    renderHud(view.hud, hudModel(shell));
}

/** Shows the solo root and syncs the board; the HUD shows score, level and hatched count. */
function renderSolo(shell: Shell, view: ViewRefs): void {
    view.solo.setAttribute('enabled', 'true');
    view.left.setAttribute('enabled', 'false');
    view.right.setAttribute('enabled', 'false');
    if (shell.dirty) {
        renderBoards(shell, view);
    }
    renderHud(view.hud, hudModel(shell));
}

/** Syncs the rendered entities and the HUD text from the current state (read-only render). */
function render(shell: Shell, view: ViewRefs): void {
    if (shell.versus.type === 'some') {
        renderVersus(shell, view);
    } else {
        renderSolo(shell, view);
    }
    if (tween.type === 'some') {
        tween = advanceSwap(activeRoot(shell, view), tween.value);
        shell.swapLock = tween.type === 'some';
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
