import type { BoardState, FallingObject, StackItem } from '../contracts/types';
import { columnX, fallingPlacements, fallingY, rowY, stackPlacements } from './board-view';
import { describe, expect, it } from 'vite-plus/test';
import { GAME_CONFIG } from '../contracts/config';
import { toObjectId } from '../contracts/types';

const boardWith = (columns: readonly (readonly StackItem[])[], falling: readonly FallingObject[]): BoardState => ({
    columns,
    fallAccumulator: 0,
    falling,
    nextObjectId: 0,
    pending: []
});

describe('columnX', () => {
    it('centers the four columns symmetrically around zero', () => {
        // Arrange / act
        const positions = [0, 1, 2, 3].map((column) => columnX(column, GAME_CONFIG));

        // Assert: ascending, and the outer pair mirrors around the middle
        expect(positions[0]).toBeLessThan(positions[1]);
        expect(positions[1]).toBeLessThan(positions[2]);
        expect(positions[2]).toBeLessThan(positions[3]);
        expect(positions[0]).toBeCloseTo(-positions[3]);
        expect(positions[1]).toBeCloseTo(-positions[2]);
    });
});

describe('rowY and fallingY', () => {
    it('stack the rows upward with the bottom row resting on the tray', () => {
        // Arrange / act / assert
        expect(rowY(0)).toBeGreaterThan(0);
        expect(rowY(1) - rowY(0)).toBeCloseTo(rowY(2) - rowY(1));
        expect(fallingY(7.25)).toBeGreaterThan(rowY(7));
    });
});

describe('stackPlacements', () => {
    it('maps every resting item bottom-up with its column and row', () => {
        // Arrange
        const board = boardWith([['base', 'm0'], [], ['m2'], []], []);

        // Act
        const placements = stackPlacements(board, GAME_CONFIG);

        // Assert
        expect(placements.map(({ column, kind, row }) => ({ column, kind, row }))).toEqual([
            { column: 0, kind: 'base', row: 0 },
            { column: 0, kind: 'm0', row: 1 },
            { column: 2, kind: 'm2', row: 0 }
        ]);
        expect(placements[0].position).toEqual([columnX(0, GAME_CONFIG), rowY(0), 0]);
    });
});

describe('fallingPlacements', () => {
    it('maps falling objects to their fractional altitude, keeping ids stable', () => {
        // Arrange
        const falling: FallingObject[] = [
            { column: 1, id: toObjectId(9), kind: 'cap', y: 8 },
            { column: 3, id: toObjectId(10), kind: 'm3', y: 5.5 }
        ];
        const board = boardWith([[], [], [], []], falling);

        // Act
        const placements = fallingPlacements(board, GAME_CONFIG);

        // Assert
        expect(placements).toEqual([
            { id: toObjectId(9), kind: 'cap', position: [columnX(1, GAME_CONFIG), fallingY(8), 0] },
            { id: toObjectId(10), kind: 'm3', position: [columnX(3, GAME_CONFIG), fallingY(5.5), 0] }
        ]);
    });
});
