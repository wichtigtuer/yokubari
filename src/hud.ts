import { none, some } from './utils/result';
import type { Option } from './utils/result';
import type { Shell } from './shell/session';

/** What the HUD shows: the solo counters, plus the match score in a versus session. */
export type HudModel = Readonly<{
    hatched: number;
    level: number;
    round: Option<number>;
    score: number;
    stage: number;
    tokens: Option<Readonly<{ left: number; right: number }>>;
}>;

/** Reads the HUD model out of the shell state (render-only). */
export function hudModel(shell: Shell): HudModel {
    if (shell.versus.type === 'some') {
        const versus = shell.versus.value;
        return {
            hatched: versus.left.score.hatched + versus.right.score.hatched,
            level: versus.left.progression.level,
            round: some(versus.round),
            score: versus.left.score.score,
            stage: shell.stage,
            tokens: some(versus.tokens)
        };
    }
    return {
        hatched: shell.score.hatched,
        level: shell.progression.level,
        round: none(),
        score: shell.score.score,
        stage: shell.stage,
        tokens: none()
    };
}

function stat(label: string, value: number): HTMLElement {
    const element = document.createElement('div');
    element.className = 'hud-stat';
    element.textContent = `${label} ${value}`;
    return element;
}

/** Renders the score/level/hatched/tokens overlay (render-only; no game rules). */
export function renderHud(hud: HTMLElement, model: HudModel): void {
    const stats = [stat('Score', model.score), stat('Level', model.level), stat('Hatched', model.hatched)];
    if (model.round.type === 'some') {
        stats.push(stat('Round', model.round.value));
    }
    if (model.tokens.type === 'some') {
        const tokens = document.createElement('div');
        tokens.className = 'hud-stat hud-tokens';
        tokens.textContent = `Tokens ${model.tokens.value.left} : ${model.tokens.value.right}`;
        stats.push(tokens);
    }
    hud.replaceChildren(...stats);
}
