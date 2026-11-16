import type { BoardState, PendingObject, Progression, SpeedMode } from '../contracts/types';
import type { GameConfig } from '../contracts/config';
import { INITIAL_SCORE } from './score';
import type { ScoreState } from './score';
import { createEmptyBoard } from './board';
import { initialProgression } from './progression';

/** One of the two competing sides. */
export type Side = 'left' | 'right';

/** What a side's player is doing this tick. */
export type SideInput = Readonly<{ softDrop: boolean; speedMode: SpeedMode }>;

/** One side of the match: its board, progression, score and the attacks queued against it. */
export type SideState = Readonly<{
    board: BoardState;
    pendingAttack: readonly PendingObject[];
    progression: Progression;
    score: ScoreState;
}>;

/** The full lock-step versus state: two isolated sides plus the match score. */
export type VersusState = Readonly<{
    left: SideState;
    right: SideState;
    round: number;
    tokens: Readonly<{ left: number; right: number }>;
}>;

/** What a versus tick can report, in adjudication order. */
export type VersusEvent =
    | Readonly<{ type: 'attack-sent'; count: number; from: Side }>
    | Readonly<{ type: 'round-decided'; outcome: RoundOutcome }>
    | Readonly<{ type: 'match-decided'; winner: Side }>;

/** How a round ended (spec §12.3); a double overflow restarts, a double clear rewards both. */
export type RoundOutcome =
    | Readonly<{ type: 'cleared'; side: Side }>
    | Readonly<{ type: 'overflow'; side: Side }>
    | Readonly<{ type: 'both-cleared' }>
    | Readonly<{ type: 'draw-overflow' }>;

/** A side at round start: empty board, fresh progression and score, no queued attacks. */
function freshSide(config: GameConfig): SideState {
    return {
        board: createEmptyBoard(),
        pendingAttack: [],
        progression: initialProgression(1, config),
        score: INITIAL_SCORE
    };
}

/** A new match: two fresh sides, no tokens, round one. */
export function createVersus(config: GameConfig): VersusState {
    return { left: freshSide(config), right: freshSide(config), round: 1, tokens: { left: 0, right: 0 } };
}

/** Re-initializes both boards for the next round; tokens persist across rounds (spec §12.3). */
export function startRound(state: VersusState, config: GameConfig): VersusState {
    return { ...state, left: freshSide(config), right: freshSide(config), round: state.round + 1 };
}
