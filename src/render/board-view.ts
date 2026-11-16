import type { BoardState, Falling, ObjectId, StackItem } from '../contracts/types';
import type { GameConfig } from '../contracts/config';

/** A world position as [x, y, z]. */
export type Position = readonly [number, number, number];

/** Where one resting stack item goes on screen. */
export type StackPlacement = Readonly<{ column: number; kind: StackItem; position: Position; row: number }>;

/** Where one falling object goes on screen; the id keeps its element stable across ticks. */
export type FallingPlacement = Readonly<{ id: ObjectId; kind: Falling; position: Position }>;

// World-space cell metrics: trays sit one cell apart, items are cubes one cell high
const CELL_WIDTH = 1.2;
const CELL_HEIGHT = 0.55;
const ITEM_SCALE = 0.5;

/** The world x of a column's center; the middle of the board sits at x = 0. */
export function columnX(column: number, config: GameConfig): number {
    return (column - (config.columns - 1) / 2) * CELL_WIDTH;
}

/** The world y of the center of the item resting at `row` (row 0 is the tray bottom). */
export function rowY(row: number): number {
    return row * CELL_HEIGHT + CELL_HEIGHT / 2;
}

/** The world y of a falling object at altitude `y` cells above the tray bottom. */
export function fallingY(altitude: number): number {
    return altitude * CELL_HEIGHT + CELL_HEIGHT / 2;
}

/** Every resting item's placement, column by column from the tray bottom up. */
export function stackPlacements(board: BoardState, config: GameConfig): StackPlacement[] {
    return board.columns.flatMap((stack, column) =>
        stack.map((kind, row) => ({ column, kind, position: [columnX(column, config), rowY(row), 0], row }))
    );
}

/** Every falling object's placement, in falling order. */
export function fallingPlacements(board: BoardState, config: GameConfig): FallingPlacement[] {
    return board.falling.map((object) => ({
        id: object.id,
        kind: object.kind,
        position: [columnX(object.column, config), fallingY(object.y), 0]
    }));
}

/** The id of the shared app-level material each object kind renders with. */
export function kindMaterialId(kind: Falling): string {
    return `mat-${kind}`;
}

/** A colored box render element for one object kind, referencing the shared material by id. */
function boxRender(kind: Falling): HTMLElement {
    const render = document.createElement('pc-render');
    render.setAttribute('type', 'box');
    render.setAttribute('material', kindMaterialId(kind));
    return render;
}

/** One box entity element for a kind at a position, optionally named for stable identity. */
function boxElement(kind: Falling, position: Position, name: string): HTMLElement {
    const entity = document.createElement('pc-entity');
    entity.setAttribute('name', name);
    entity.setAttribute('position', position.join(' '));
    entity.setAttribute('scale', `${ITEM_SCALE} ${ITEM_SCALE} ${ITEM_SCALE}`);
    entity.append(boxRender(kind));
    return entity;
}

/**
 * Rebuilds the entities under `root` from the board: resting stacks plus falling objects
 * (named `falling-<id>` so the swap tween can find them). Render-only — no game rules here.
 */
export function syncBoardView(root: HTMLElement, board: BoardState, config: GameConfig): void {
    const resting = stackPlacements(board, config).map((placement) =>
        boxElement(placement.kind, placement.position, `stack-${placement.column}-${placement.row}`)
    );
    const falling = fallingPlacements(board, config).map((placement) =>
        boxElement(placement.kind, placement.position, `falling-${placement.id}`)
    );
    root.replaceChildren(...resting, ...falling);
}
