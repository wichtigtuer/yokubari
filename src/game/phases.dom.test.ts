import type { App, AppEvent } from './phases';
import { describe, expect, it } from 'vite-plus/test';
import { initialApp, transition } from './phases';

import { GAME_CONFIG } from '../contracts/config';
import type { Phase } from '../contracts/types';
import { flatMapResult } from '../utils/result';

const appIn = (phase: Phase): App => ({ menus: [], phase, players: 1 });

const expectPhase = (app: App, event: AppEvent, phase: Phase): void => {
    const result = transition(app, event, GAME_CONFIG);
    expect(result.type).toBe('ok');
    if (result.type === 'ok') {
        expect(result.value.phase).toBe(phase);
    }
};

describe('transition legal moves (spec §13)', () => {
    it('title + choose-players(2) enters the menu with two menu states', () => {
        // Arrange / act
        const result = transition(initialApp(), { count: 2, type: 'choose-players' }, GAME_CONFIG);

        // Assert
        expect(result.type).toBe('ok');
        if (result.type === 'ok') {
            expect(result.value.phase).toBe('menu');
            expect(result.value.players).toBe(2);
            expect(result.value.menus).toHaveLength(2);
        }
    });

    it('walks menu -> ready -> playing', () => {
        // Arrange / act / assert
        expectPhase(appIn('menu'), { type: 'confirm-menu' }, 'ready');
        expectPhase(appIn('ready'), { type: 'advance' }, 'playing');
    });

    it('T16: Start pauses and resumes, round-tripping back to playing', () => {
        // Arrange
        const playing = appIn('playing');
        const pressStart = flatMapResult((app: App) => transition(app, { type: 'start-pressed' }, GAME_CONFIG));

        // Act: two presses — pause, then resume
        const resumed = pressStart(transition(playing, { type: 'start-pressed' }, GAME_CONFIG));

        // Assert
        expect(resumed.type).toBe('ok');
        if (resumed.type === 'ok') {
            expect(resumed.value).toEqual(playing);
        }
    });

    it('walks playing -> stage-clear -> ready for the next stage', () => {
        // Arrange / act / assert
        expectPhase(appIn('playing'), { type: 'stage-cleared' }, 'stage-clear');
        expectPhase(appIn('stage-clear'), { type: 'advance' }, 'ready');
    });
});

describe('transition illegal moves (spec §13)', () => {
    it('T6: no simulation-driving event reaches the board while paused — time cannot pass', () => {
        // Arrange: every event except the resume press
        const paused = appIn('paused');
        const events: AppEvent[] = [
            { type: 'advance' },
            { type: 'game-over' },
            { type: 'stage-cleared' },
            { type: 'confirm-menu' },
            { type: 'round-decided' },
            { type: 'match-decided' },
            { count: 1, type: 'choose-players' }
        ];

        // Act / Assert: all rejected, so the tick loop has nothing to run on while paused
        for (const event of events) {
            expect(transition(paused, event, GAME_CONFIG).type).toBe('error');
        }
        expect(transition(paused, { type: 'start-pressed' }, GAME_CONFIG).type).toBe('ok');
    });

    it('rejects events the graph does not allow, with a typed error', () => {
        // Arrange / act
        const fromTitle = transition(appIn('title'), { type: 'game-over' }, GAME_CONFIG);
        const fromPaused = transition(appIn('paused'), { type: 'confirm-menu' }, GAME_CONFIG);
        const fromStageClear = transition(appIn('stage-clear'), { type: 'start-pressed' }, GAME_CONFIG);

        // Assert
        expect(fromTitle).toEqual({
            error: { event: 'game-over', from: 'title', reason: 'illegal-transition' },
            type: 'error'
        });
        expect(fromPaused).toEqual({
            error: { event: 'confirm-menu', from: 'paused', reason: 'illegal-transition' },
            type: 'error'
        });
        expect(fromStageClear).toEqual({
            error: { event: 'start-pressed', from: 'stage-clear', reason: 'illegal-transition' },
            type: 'error'
        });
    });
});

describe('transition end states (spec §13)', () => {
    it('walks playing -> game-over on overflow', () => {
        // Arrange / act / assert
        expectPhase(appIn('playing'), { type: 'game-over' }, 'game-over');
    });

    it('walks versus rounds: playing -> round-result -> ready, or -> match-result', () => {
        // Arrange / act / assert
        expectPhase(appIn('playing'), { type: 'round-decided' }, 'round-result');
        expectPhase(appIn('round-result'), { type: 'advance' }, 'ready');
        expectPhase(appIn('round-result'), { type: 'match-decided' }, 'match-result');
    });
});
