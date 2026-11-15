import type { TickEvent } from './tick';

/** A player's running score and hatch count; both only ever increase (spec §11). */
export type ScoreState = Readonly<{ hatched: number; score: number }>;

/** The zeroed score a game starts with. */
export const INITIAL_SCORE: ScoreState = { hatched: 0, score: 0 };

/**
 * Applies one tick's events to the score: `scored` and `hatched` add their points, a hatch also
 * increments the counter. No combos, multipliers or chains ever apply (spec §11).
 */
export function applyTickEvents(scoreState: ScoreState, events: readonly TickEvent[]): ScoreState {
    let { score } = scoreState;
    let { hatched } = scoreState;
    for (const event of events) {
        if (event.type === 'scored') {
            score += event.points;
        }
        if (event.type === 'hatched') {
            score += event.points;
            hatched += 1;
        }
    }
    return { hatched, score };
}
