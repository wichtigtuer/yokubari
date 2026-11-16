import type { CursorPair } from '../contracts/types';

const LEFT_OF: Readonly<Record<CursorPair, CursorPair>> = { 0: 0, 1: 0, 2: 1 };
const RIGHT_OF: Readonly<Record<CursorPair, CursorPair>> = { 0: 1, 1: 2, 2: 2 };

/** Moves the cursor one pair left, clamped at pair 0 — no wrap-around (spec §5). */
export function moveCursorLeft(cursor: CursorPair): CursorPair {
    return LEFT_OF[cursor];
}

/** Moves the cursor one pair right, clamped at pair 2 — no wrap-around (spec §5). */
export function moveCursorRight(cursor: CursorPair): CursorPair {
    return RIGHT_OF[cursor];
}
