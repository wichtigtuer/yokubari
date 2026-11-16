import type { App, AppEvent } from '../game/phases';
import type { BoardState, CursorPair, Progression } from '../contracts/types';
import { INITIAL_SCORE, applyTickEvents } from '../game/score';
import type { SideInput, VersusEvent, VersusState } from '../game/versus';
import { adjustMenuField, defaultMenuParams } from '../game/menu';
import { advanceRamp, batchSpawned, initialProgression, registerFallen } from '../game/progression';
import { createVersus, startRound, tickVersus } from '../game/versus';
import { generatePrefill, isStageCleared, stageBonus } from '../game/stage';
import { initialApp, transition } from '../game/phases';
import { moveCursorLeft, moveCursorRight } from '../game/cursor';
import { none, some } from '../utils/result';
import type { FallContext } from '../game/gravity';
import { GAME_CONFIG } from '../contracts/config';
import type { InputAction } from '../input';
import type { MenuParams } from '../game/menu';
import type { Option } from '../utils/result';
import type { Rng } from '../utils/random';
import type { ScoreState } from '../game/score';
import { createEmptyBoard } from '../game/board';
import { createRng } from '../utils/random';
import { swapTrays } from '../game/swap';
import { tickBoard } from '../game/tick';

// The cursor pair a new game starts with
const INITIAL_CURSOR: CursorPair = 1;

/** The composition root's mutable shell state; all rules live in the pure core modules. */
export type Shell = {
    app: App;
    board: BoardState;
    cursor: CursorPair;
    dirty: boolean;
    menu: MenuParams;
    playerChoice: 1 | 2;
    progression: Progression;
    rngLeft: Rng;
    rngRight: Rng;
    score: ScoreState;
    softDrop: boolean;
    stage: number;
    versus: Option<VersusState>;
};

/** The shell a page boots with: title screen, empty board, both RNG streams seeded. */
export function createShell(seed: number): Shell {
    return {
        app: initialApp(),
        board: createEmptyBoard(),
        cursor: INITIAL_CURSOR,
        dirty: true,
        menu: defaultMenuParams(GAME_CONFIG),
        playerChoice: 1,
        progression: initialProgression(1, GAME_CONFIG),
        rngLeft: createRng(seed),
        rngRight: createRng(seed + 1),
        score: INITIAL_SCORE,
        softDrop: false,
        stage: 1,
        versus: none()
    };
}

/** Applies a phase-graph event; illegal transitions are typed errors the shell simply ignores. */
function applyEvent(shell: Shell, event: AppEvent): void {
    const next = transition(shell.app, event, GAME_CONFIG);
    if (next.type === 'ok') {
        shell.app = next.value;
    }
}

/** Sets up a solo stage: prefilled trays, fresh progression, score carries over (spec §12.2). */
function setupStage(shell: Shell, stage: number): void {
    shell.board = { ...createEmptyBoard(), columns: generatePrefill(shell.rngLeft, stage, GAME_CONFIG) };
    shell.progression = initialProgression(shell.menu.level, GAME_CONFIG);
    shell.stage = stage;
    shell.dirty = true;
}

/** Sets up the session the menu confirmed: a versus match for two players, solo stage 1 else. */
function setupGame(shell: Shell): void {
    if (shell.app.players === 2) {
        shell.versus = some(createVersus(GAME_CONFIG));
        shell.dirty = true;
        return;
    }
    shell.versus = none();
    shell.score = INITIAL_SCORE;
    setupStage(shell, 1);
}

/** The progression after a tick: count landings, ramp up, and consume an armed level-up batch. */
function settleProgression(
    progression: Progression,
    result: Readonly<{ events: readonly { type: string }[]; landedCount: number }>
): Progression {
    const counted = registerFallen(progression, result.landedCount, GAME_CONFIG);
    const ramped = advanceRamp(counted, GAME_CONFIG);
    if (result.events.some((event) => event.type === 'batch-spawned')) {
        return batchSpawned(ramped, GAME_CONFIG);
    }
    return ramped;
}

/** Game-over and stage-clear detection after a solo tick (spec §12.2). */
function settleSoloOutcome(shell: Shell, events: readonly { type: string }[]): void {
    if (events.some((event) => event.type === 'game-over')) {
        applyEvent(shell, { type: 'game-over' });
        return;
    }
    if (isStageCleared(shell.board)) {
        shell.score = { ...shell.score, score: shell.score.score + stageBonus(shell.stage, GAME_CONFIG) };
        applyEvent(shell, { type: 'stage-cleared' });
    }
}

/** The fall context for the solo board: input flags plus what the progression armed. */
function soloContext(shell: Shell): FallContext {
    return {
        batchSize: shell.progression.pendingBatchSize,
        level: shell.progression.level,
        rampCounter: shell.progression.rampCounter,
        softDrop: shell.softDrop,
        speedMode: shell.menu.speed
    };
}

/** One solo core tick: board, score, progression, then the round-level outcomes. */
function tickSolo(shell: Shell): void {
    const result = tickBoard(shell.board, soloContext(shell), shell.rngLeft, GAME_CONFIG);
    shell.board = result.board;
    shell.score = applyTickEvents(shell.score, result.events);
    shell.progression = settleProgression(shell.progression, result);
    shell.dirty = true;
    settleSoloOutcome(shell, result.events);
}

/** Applies round and match outcomes: restart a decided round, or end the match via the graph. */
function settleVersusRound(shell: Shell, state: VersusState, events: readonly VersusEvent[]): void {
    const matchDecided = events.some((event) => event.type === 'match-decided');
    const roundDecided = events.some((event) => event.type === 'round-decided');
    if (roundDecided && !matchDecided) {
        shell.versus = some(startRound(state, GAME_CONFIG));
        return;
    }
    shell.versus = some(state);
    if (matchDecided) {
        applyEvent(shell, { type: 'round-decided' });
        applyEvent(shell, { type: 'match-decided' });
    }
}

/** One versus lock-step tick; rounds restart immediately, the match ends through the phase graph. */
function tickVersusShell(shell: Shell, versus: VersusState): void {
    const inputs: Readonly<Record<'left' | 'right', SideInput>> = {
        left: { softDrop: shell.softDrop, speedMode: shell.menu.speed },
        right: { softDrop: false, speedMode: shell.menu.speed }
    };
    const { events, state } = tickVersus(versus, inputs, { left: shell.rngLeft, right: shell.rngRight }, GAME_CONFIG);
    settleVersusRound(shell, state, events);
    shell.dirty = true;
}

/** Advances the running session by one fixed tick. */
export function step(shell: Shell): void {
    if (shell.versus.type === 'some') {
        tickVersusShell(shell, shell.versus.value);
        return;
    }
    tickSolo(shell);
}

const PLAYER_CHOICE: Readonly<Record<number, 1 | 2>> = { '-1': 1, '1': 2 };
const CURSOR_MOVES: Readonly<Record<number, (cursor: CursorPair) => CursorPair>> = {
    '-1': moveCursorLeft,
    '1': moveCursorRight
};

/** Start on the title screen: choose one or two players. */
function startFromTitle(shell: Shell): void {
    applyEvent(shell, { count: shell.playerChoice, type: 'choose-players' });
}

/** Start on the menu screen: confirm and set the confirmed session up. */
function startFromMenu(shell: Shell): void {
    applyEvent(shell, { type: 'confirm-menu' });
    setupGame(shell);
}

/** Start on the stage-clear screen: set up the next stage, then advance to ready. */
function startFromStageClear(shell: Shell): void {
    setupStage(shell, shell.stage + 1);
    applyEvent(shell, { type: 'advance' });
}

const START_PHASES: Readonly<Record<string, (shell: Shell) => void>> = {
    menu: startFromMenu,
    paused: (shell) => {
        applyEvent(shell, { type: 'start-pressed' });
    },
    playing: (shell) => {
        applyEvent(shell, { type: 'start-pressed' });
    },
    ready: (shell) => {
        applyEvent(shell, { type: 'advance' });
    },
    'round-result': (shell) => {
        applyEvent(shell, { type: 'advance' });
    },
    'stage-clear': startFromStageClear,
    title: startFromTitle
};

/** The Start button by phase (spec §13): choose players, confirm, advance, pause and resume. */
function handleStart(shell: Shell): void {
    if (Object.hasOwn(START_PHASES, shell.app.phase)) {
        START_PHASES[shell.app.phase](shell);
    }
}

/** Left/Right by phase: player count on the title, level on the menu, the cursor while playing. */
function handleCursor(shell: Shell, direction: -1 | 1): void {
    const { phase } = shell.app;
    if (phase === 'title') {
        shell.playerChoice = PLAYER_CHOICE[direction];
        return;
    }
    if (phase === 'menu') {
        shell.menu = adjustMenuField(shell.menu, 'level', direction, GAME_CONFIG);
        return;
    }
    if (phase === 'playing') {
        shell.cursor = CURSOR_MOVES[direction](shell.cursor);
        shell.dirty = true;
    }
}

/** The swap button: exchanges the trays under the cursor of the running session (spec §6). */
function handleSwap(shell: Shell): void {
    if (shell.app.phase !== 'playing') {
        return;
    }
    if (shell.versus.type === 'some') {
        const versus = shell.versus.value;
        const swapped = swapTrays(versus.left.board, shell.cursor, GAME_CONFIG);
        shell.versus = some({ ...versus, left: { ...versus.left, board: swapped.board } });
    } else {
        shell.board = swapTrays(shell.board, shell.cursor, GAME_CONFIG).board;
    }
    shell.dirty = true;
}

/** Held soft drop arrives through onSoftDrop; the discrete action is deliberately a no-op. */
function ignoreSoftDrop(): void {
    // Deliberate no-op
}

const ACTION_HANDLERS: Readonly<Record<InputAction, (shell: Shell) => void>> = {
    'cursor-left': (shell) => {
        handleCursor(shell, -1);
    },
    'cursor-right': (shell) => {
        handleCursor(shell, 1);
    },
    'soft-drop': ignoreSoftDrop,
    start: handleStart,
    swap: handleSwap
};

/** Routes one input action into the shell. */
export function dispatchAction(shell: Shell, action: InputAction): void {
    ACTION_HANDLERS[action](shell);
}
