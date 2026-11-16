import type { GameConfig } from '../contracts/config';

/** Music selection on the menu: off or one of the configured tracks. */
export type MusicChoice = 'off' | 0 | 1 | 2;

/** The editable parameters of one player's game (spec §12.0). */
export type MenuParams = Readonly<{ level: number; mode: 'A' | 'B'; music: MusicChoice; speed: 'low' | 'high' }>;

/** The menu fields Left/Right edits (spec §5). */
export type MenuField = 'level' | 'mode' | 'music' | 'speed';

const MUSIC_SEQUENCE: readonly MusicChoice[] = ['off', 0, 1, 2];
const OTHER_MODE: Readonly<Record<MenuParams['mode'], MenuParams['mode']>> = { A: 'B', B: 'A' };
const OTHER_SPEED: Readonly<Record<MenuParams['speed'], MenuParams['speed']>> = { high: 'low', low: 'high' };

/** Steps through off and the configured tracks, wrapping in both directions. */
function cycleMusic(music: MusicChoice, direction: -1 | 1, config: GameConfig): MusicChoice {
    const sequence = MUSIC_SEQUENCE.slice(0, config.musicTrackCount + 1);
    const current = sequence.indexOf(music);
    return sequence[(current + direction + sequence.length) % sequence.length];
}

/** The menu values a fresh game starts from: mode A, lowest level, low speed, music off. */
export function defaultMenuParams(config: GameConfig): MenuParams {
    const [minLevel] = config.menuLevels;
    return { level: minLevel, mode: 'A', music: 'off', speed: 'low' };
}

/** Adjusts one menu field: level clamps to the configured range, the other fields cycle. */
export function adjustMenuField(
    params: MenuParams,
    field: MenuField,
    direction: -1 | 1,
    config: GameConfig
): MenuParams {
    if (field === 'level') {
        const [minLevel, maxLevel] = config.menuLevels;
        return { ...params, level: Math.min(Math.max(params.level + direction, minLevel), maxLevel) };
    }
    if (field === 'mode') {
        return { ...params, mode: OTHER_MODE[params.mode] };
    }
    if (field === 'speed') {
        return { ...params, speed: OTHER_SPEED[params.speed] };
    }
    return { ...params, music: cycleMusic(params.music, direction, config) };
}
