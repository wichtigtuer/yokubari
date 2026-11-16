import { err, ok } from '../utils/result';
import type { GameConfig } from '../contracts/config';
import type { MenuParams } from './menu';
import type { Phase } from '../contracts/types';
import type { Result } from '../utils/result';
import { defaultMenuParams } from './menu';

/** Everything that can drive the application from one phase to another. */
export type AppEvent =
    | Readonly<{ type: 'choose-players'; count: 1 | 2 }>
    | Readonly<{ type: 'confirm-menu' }>
    | Readonly<{ type: 'start-pressed' }>
    | Readonly<{ type: 'game-over' }>
    | Readonly<{ type: 'stage-cleared' }>
    | Readonly<{ type: 'round-decided' }>
    | Readonly<{ type: 'match-decided' }>
    | Readonly<{ type: 'advance' }>;

/** The application shell's phase state: where we are and what was chosen on the way. */
export type App = Readonly<{ menus: readonly MenuParams[]; phase: Phase; players: 1 | 2 }>;

/** A transition the phase graph does not allow. */
export type TransitionError = Readonly<{ event: AppEvent['type']; from: Phase; reason: 'illegal-transition' }>;

const SIMPLE_TRANSITIONS: readonly (readonly [Phase, AppEvent['type'], Phase])[] = [
    ['menu', 'confirm-menu', 'ready'],
    ['ready', 'advance', 'playing'],
    ['playing', 'start-pressed', 'paused'],
    ['paused', 'start-pressed', 'playing'],
    ['playing', 'game-over', 'game-over'],
    ['playing', 'stage-cleared', 'stage-clear'],
    ['stage-clear', 'advance', 'ready'],
    ['playing', 'round-decided', 'round-result'],
    ['round-result', 'advance', 'ready'],
    ['round-result', 'match-decided', 'match-result']
];

/** The application boots into the title screen with no players chosen yet. */
export function initialApp(): App {
    return { menus: [], phase: 'title', players: 1 };
}

/** Builds one default menu per chosen player. */
function buildMenus(count: 1 | 2, config: GameConfig): MenuParams[] {
    const params = defaultMenuParams(config);
    return Array.from({ length: count }, () => params);
}

/**
 * Applies one event to the phase graph (spec §13). `start-pressed` is context-dependent — it
 * pauses while playing and resumes while paused. Anything the graph does not allow comes back as
 * a typed error; the caller logs and ignores it.
 */
export function transition(app: App, event: AppEvent, config: GameConfig): Result<App, TransitionError> {
    if (app.phase === 'title' && event.type === 'choose-players') {
        return ok({ menus: buildMenus(event.count, config), phase: 'menu', players: event.count });
    }
    const matches = SIMPLE_TRANSITIONS.filter(([from, eventType]) => from === app.phase && eventType === event.type);
    if (matches.length === 0) {
        return err({ event: event.type, from: app.phase, reason: 'illegal-transition' });
    }
    const [match] = matches;
    return ok({ ...app, phase: match[2] });
}
