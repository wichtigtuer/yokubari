import { dispatchInput, getState, stepFrames } from './base-fixtures';
import type { GameStateSnapshot, SoloSnapshot } from '../src/test-api';
import type { Page } from '@playwright/test';

const EMPTY = 'empty';

const topOf = (column: readonly string[]): string => column.at(-1) ?? EMPTY;

/** Whether landing `kind` on this stack scores: pair clear, base pair, or a hatch for a cap. */
const scoresOn = (column: readonly string[], kind: string): boolean => {
    if (kind === 'cap') {
        return column.includes('base');
    }
    return topOf(column) === kind;
};

/** The scoring swap for one falling object, if a neighbour's stack scores for it. */
const steerObject = (
    columns: readonly (readonly string[])[],
    object: SoloSnapshot['board']['falling'][number]
): number | 'none' => {
    if (scoresOn(columns[object.column], object.kind)) {
        return 'none';
    }
    const neighbours = [object.column - 1, object.column + 1];
    const above =
        object.y >
        Math.max(
            columns[object.column].length,
            columns[object.column - 1]?.length ?? 0,
            columns[object.column + 1]?.length ?? 0
        );
    if (!above) {
        return 'none';
    }
    for (const neighbour of neighbours) {
        if (neighbour >= 0 && neighbour < columns.length && scoresOn(columns[neighbour], object.kind)) {
            return Math.min(object.column, neighbour);
        }
    }
    const shorter = neighbours.filter(
        (neighbour) =>
            neighbour >= 0 &&
            neighbour < columns.length &&
            columns[neighbour].length + 1 < columns[object.column].length
    );
    if (shorter.length === 0) {
        return 'none';
    }
    return Math.min(object.column, shorter[0]);
};

/**
 * The swap that scores next, if any: exchange a falling object's column with a neighbour whose
 * stack scores for it, while the object is still too high to be carried along (spec §6 — a
 * carried object follows its own stack, so the scoring stack must come to the object). Caps go
 * first: a hatch clears a whole run and keeps the board alive.
 */
export const planSurvivalSwap = (solo: SoloSnapshot): number | 'none' => {
    const highFirst = [...solo.board.falling].sort((first, second) => second.y - first.y);
    const caps = highFirst.filter((object) => object.kind === 'cap');
    const rest = highFirst.filter((object) => object.kind !== 'cap');
    for (const object of [...caps, ...rest]) {
        const pair = steerObject(solo.board.columns, object);
        if (pair !== 'none') {
            return pair;
        }
    }
    return 'none';
};

/** Moves the cursor to the target pair with discrete cursor actions. */
export const moveCursorTo = async (page: Page, target: number): Promise<void> => {
    let state = await getState(page);
    while (state.session.kind === 'solo' && state.session.solo.cursor !== target) {
        const direction = state.session.solo.cursor < target ? 'cursor-right' : 'cursor-left';
        state = await dispatchInput(page, direction);
    }
};

/** Plays one chunk: plan and apply at most one scoring swap, advance screens, step the clock. */
export const playChunk = async (page: Page, frames: number): Promise<GameStateSnapshot> => {
    const state = await getState(page);
    if (state.session.kind === 'solo') {
        const pair = planSurvivalSwap(state.session.solo);
        if (pair !== 'none') {
            await moveCursorTo(page, pair);
            await dispatchInput(page, 'swap');
        }
    }
    if (state.phase === 'stage-clear' || state.phase === 'ready') {
        await dispatchInput(page, 'start');
    }
    return stepFrames(page, frames);
};
