import { expect, runReplay, test } from './base-fixtures';
import fixtureJson from './fixtures/solo-replay.json' with { type: 'json' };
import { parseReplayFixture } from './replay-fixture';

// Replay: feed the committed fixture through the manual clock, then assert the final state against
// The committed snapshot. Update with `pnpm run test:e2e:update-snapshots`.
test('solo replay reaches the committed final state', async ({ page }) => {
    const fixture = parseReplayFixture(fixtureJson);
    expect(fixture.type).toBe('ok');
    if (fixture.type === 'error') {
        return;
    }

    const state = await runReplay(page, fixture.value);
    expect(JSON.stringify(state, null, 2)).toMatchSnapshot(`${fixture.value.name}.json`);
});
