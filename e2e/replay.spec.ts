import { expect, getState, gotoTestMode, runReplay, stepFrames, test } from './base-fixtures';
import fixtureJson from './fixtures/canonical-replay.json' with { type: 'json' };
import { parseReplayFixture } from './replay-fixture';

// Level 3 E2E: feed a scripted frame/input fixture through the manual clock, then assert the
// Resulting state against the committed snapshot. Update with `pnpm run test:e2e:update-snapshots`.
test('canonical replay reaches the committed final state', async ({ page }) => {
    const fixture = parseReplayFixture(fixtureJson);
    expect(fixture.type).toBe('ok');
    if (fixture.type === 'error') {
        return;
    }

    const state = await runReplay(page, fixture.value);
    expect(JSON.stringify(state, null, 2)).toMatchSnapshot(`${fixture.value.name}.json`);
});

// Render-only frames must not advance the logical clock: frameIndex only moves with stepFrames()
test('render-only frames do not increment frameIndex', async ({ page }) => {
    await gotoTestMode(page);

    // Let the rAF loop render freely for a moment with the frozen clock
    await page.waitForTimeout(100);
    const before = await getState(page);
    const after = await stepFrames(page, 10);

    expect(before.frameIndex).toBe(0);
    expect(after.frameIndex).toBe(10);
    expect(before.rotation).toStrictEqual([0, 0, 0]);
});
