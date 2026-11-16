import type { SessionSnapshot, SideSnapshot, SoloSnapshot } from '../test-api';
import type { Shell } from './session';
import type { VersusState } from '../game/versus';

function soloSnapshot(shell: Shell): SoloSnapshot {
    return {
        board: shell.board,
        cursor: shell.cursor,
        hatched: shell.score.hatched,
        level: shell.progression.level,
        score: shell.score.score,
        stage: shell.stage
    };
}

function sideSnapshot(side: VersusState['left']): SideSnapshot {
    return {
        board: side.board,
        hatched: side.score.hatched,
        level: side.progression.level,
        pendingAttack: side.pendingAttack,
        score: side.score.score
    };
}

/** The observable session state for the test API. */
export function sessionSnapshot(shell: Shell): SessionSnapshot {
    if (shell.versus.type === 'some') {
        const versus = shell.versus.value;
        return {
            kind: 'versus',
            left: sideSnapshot(versus.left),
            right: sideSnapshot(versus.right),
            round: versus.round,
            tokens: versus.tokens
        };
    }
    if (shell.app.phase === 'title' || shell.app.phase === 'menu') {
        return { kind: 'none' };
    }
    return { kind: 'solo', solo: soloSnapshot(shell) };
}
