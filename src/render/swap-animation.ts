import { none, some } from '../utils/result';
import type { ObjectId } from '../contracts/types';
import type { Option } from '../utils/result';

/** How many rendered frames a swap tween spans (spec §6 leaves the length to presentation). */
export const SWAP_TWEEN_FRAMES = 8;

/** One tweened element: where it started and where the new state put it. */
type TweenTrack = Readonly<{ from: number; name: string; to: number }>;

/** A running swap tween: the element tracks and how far along we are. */
export type SwapAnimation = Readonly<{
    elapsed: number;
    totalFrames: number;
    tracks: readonly TweenTrack[];
}>;

/** The element names a swap tween moves: both stacks of the pair plus the carried objects. */
export function swapElementNames(pair: number, carried: readonly ObjectId[], capacity: number): string[] {
    const stacks: string[] = [];
    for (let row = 0; row < capacity; row += 1) {
        stacks.push(`stack-${pair}-${row}`, `stack-${pair + 1}-${row}`);
    }
    return [...stacks, ...carried.map((id) => `falling-${id}`)];
}

function findElement(root: HTMLElement, name: string): Option<HTMLElement> {
    const element = root.querySelector(`pc-entity[name="${name}"]`);
    if (element instanceof HTMLElement) {
        return some(element);
    }
    return none();
}

function positionX(element: HTMLElement): number {
    const [worldX] = (element.getAttribute('position') ?? '0 0 0').split(' ').map(Number);
    return worldX;
}

function setPositionX(element: HTMLElement, worldX: number): void {
    const [, worldY, worldZ] = (element.getAttribute('position') ?? '0 0 0').split(' ');
    element.setAttribute('position', `${worldX} ${worldY} ${worldZ}`);
}

/** Records where the named elements render right now — the pre-swap x positions. */
export function captureOrigins(root: HTMLElement, names: readonly string[]): Record<string, number> {
    const origins: Record<string, number> = {};
    for (const name of names) {
        const element = findElement(root, name);
        if (element.type === 'some') {
            origins[name] = positionX(element.value);
        }
    }
    return origins;
}

/**
 * Starts the tween after a sync: each named element that existed before AND after the swap snaps
 * back to its pre-swap x, then slides home over SWAP_TWEEN_FRAMES frames.
 */
export function beginSwap(root: HTMLElement, origins: Readonly<Record<string, number>>): SwapAnimation {
    const tracks: TweenTrack[] = [];
    for (const [name, from] of Object.entries(origins)) {
        const element = findElement(root, name);
        if (element.type === 'some') {
            tracks.push({ from, name, to: positionX(element.value) });
            setPositionX(element.value, from);
        }
    }
    return { elapsed: 0, totalFrames: SWAP_TWEEN_FRAMES, tracks };
}

/** Advances the tween one frame; returns the next state, or none once the elements are home. */
export function advanceSwap(root: HTMLElement, animation: SwapAnimation): Option<SwapAnimation> {
    const elapsed = animation.elapsed + 1;
    const progress = elapsed / animation.totalFrames;
    for (const track of animation.tracks) {
        const element = findElement(root, track.name);
        if (element.type === 'some') {
            setPositionX(element.value, track.from + (track.to - track.from) * progress);
        }
    }
    if (elapsed >= animation.totalFrames) {
        return none();
    }
    return some({ ...animation, elapsed });
}
