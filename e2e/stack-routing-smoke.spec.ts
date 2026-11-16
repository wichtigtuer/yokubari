import { dispatchInput, expect, getState, gotoTestMode, stepFrames, test } from './base-fixtures';

// The shell boots into the title screen; Start chooses 1P, confirms the menu and starts playing
test('title flows to playing through the menu and ready phases', async ({ page }) => {
    await gotoTestMode(page);
    const atTitle = await getState(page);
    expect(atTitle.phase).toBe('title');

    await dispatchInput(page, 'start');
    const atMenu = await getState(page);
    expect(atMenu.phase).toBe('menu');

    await dispatchInput(page, 'start');
    const atReady = await getState(page);
    expect(atReady.phase).toBe('ready');

    await dispatchInput(page, 'start');
    const atPlaying = await getState(page);
    expect(atPlaying.phase).toBe('playing');
});

// A solo stage starts prefilled (spec §12.2) and the manual clock drops objects onto the trays
test('stepping frames advances the solo board deterministically', async ({ page }) => {
    await gotoTestMode(page);
    await dispatchInput(page, 'start');
    await dispatchInput(page, 'start');
    await dispatchInput(page, 'start');

    const initial = await getState(page);
    if (initial.session.kind !== 'solo') {
        throw new Error('expected a solo session after confirming the menu');
    }
    expect(initial.session.solo.board.columns.some((column) => column.length > 0)).toBe(true);

    const stepped = await stepFrames(page, 120);
    expect(stepped.frameIndex).toBe(120);
    if (stepped.session.kind !== 'solo') {
        throw new Error('expected the solo session to continue');
    }

    // A batch has spawned: objects are falling or waiting out their staggered entry
    const inFlight = stepped.session.solo.board.falling.length + stepped.session.solo.board.pending.length;
    expect(inFlight).toBeGreaterThan(0);
});
