import type { Phase } from './contracts/types';
import type { Shell } from './shell/session';

function overlay(lines: readonly string[]): HTMLElement {
    const element = document.createElement('div');
    element.className = 'screen-overlay';
    const rows = lines.map((line) => {
        const row = document.createElement('p');
        row.textContent = line;
        return row;
    });
    element.replaceChildren(...rows);
    return element;
}

const PLAYER_LABELS: Readonly<Record<number, string>> = { 1: '1P', 2: '2P' };

function titleScreen(shell: Shell): HTMLElement {
    return overlay(['STACK ROUTING', `← ${PLAYER_LABELS[shell.playerChoice]} →`, 'Enter: start']);
}

function menuScreen(shell: Shell): HTMLElement {
    const { menu } = shell;
    return overlay([`Mode ${menu.mode} · Level ${menu.level} · Speed ${menu.speed}`, '← →: level', 'Enter: confirm']);
}

function readyScreen(shell: Shell): HTMLElement {
    return overlay([`Stage ${shell.stage}`, 'Enter: play']);
}

function stageClearScreen(shell: Shell): HTMLElement {
    return overlay([`Stage ${shell.stage} clear!`, `Score ${shell.score.score}`, 'Enter: next stage']);
}

function gameOverScreen(shell: Shell): HTMLElement {
    return overlay(['Game Over', `Score ${shell.score.score}`]);
}

function matchResultScreen(shell: Shell): HTMLElement {
    if (shell.versus.type === 'some') {
        const { tokens } = shell.versus.value;
        return overlay(['Match Over', `Tokens ${tokens.left} : ${tokens.right}`]);
    }
    return overlay(['Match Over']);
}

const SCREENS: Readonly<Record<Phase, (shell: Shell) => HTMLElement>> = {
    'game-over': gameOverScreen,
    'match-result': matchResultScreen,
    menu: menuScreen,
    paused: () => overlay(['Paused']),
    playing: () => overlay([]),
    ready: readyScreen,
    'round-result': () => overlay(['Round Over', 'Enter: next round']),
    'stage-clear': stageClearScreen,
    title: titleScreen
};

/** The overlay a phase shows, or none while playing (spec §13). */
export function screenFor(shell: Shell, phase: Phase): HTMLElement {
    return SCREENS[phase](shell);
}

/** The last key rendered into each root, so unchanged screens are not rebuilt every frame. */
const rendered = new WeakMap<HTMLElement, string>();

/** The versus token score for the key, or a marker when no match is running. */
function tokensKey(shell: Shell): string {
    if (shell.versus.type === 'none') {
        return 'none';
    }
    const { tokens } = shell.versus.value;
    return `${tokens.left}:${tokens.right}`;
}

/** Everything the overlay shows; a change in any part means the screen needs a rebuild. */
function screenKey(shell: Shell): string {
    return [
        shell.app.phase,
        shell.stage,
        shell.score.score,
        shell.playerChoice,
        shell.menu.level,
        shell.menu.mode,
        shell.menu.speed,
        tokensKey(shell)
    ].join('|');
}

/** Renders the phase overlay into the screens root; empty while playing (render-only). */
export function renderScreens(root: HTMLElement, shell: Shell): void {
    const key = screenKey(shell);
    if (rendered.get(root) === key) {
        return;
    }
    rendered.set(root, key);
    if (shell.app.phase === 'playing') {
        root.replaceChildren();
        return;
    }
    root.replaceChildren(screenFor(shell, shell.app.phase));
}
