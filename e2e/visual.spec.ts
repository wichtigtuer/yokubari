import { expect, freezeForSnapshot, gotoTestMode, stepFrames, test } from './base-fixtures';

// Visual check: replay to a deterministic checkpoint, freeze, then compare the canvas against the
// Committed baseline. Regenerate baselines with `pnpm run test:e2e:update-snapshots`.
test('scene matches the baseline after a replay checkpoint @snapshot', async ({ page }) => {
    await gotoTestMode(page);
    await stepFrames(page, 120);
    await freezeForSnapshot(page);

    const canvas = page.locator('pc-app canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveScreenshot('scene-after-120-frames.png');
});
