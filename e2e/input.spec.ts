import { expect, gotoTestMode, stepFrames, test } from './base-fixtures';

// Integration over mocking: a real pointer event on the canvas is dispatched by <pc-app> to the
// <pc-entity> under the pointer (the cube sits at the screen center)
test('clicking the cube reverses its spin', async ({ page }) => {
    await gotoTestMode(page);

    const spunForward = await stepFrames(page, 30);
    expect(spunForward.direction).toBe(1);

    const canvas = page.locator('pc-app canvas');
    await canvas.click();

    // The pick is an asynchronous GPU readback, so synchronize on the state the click produces
    // Rather than assuming the synthesized pointerup has landed
    await page.waitForFunction(() => window.__pcTestApi?.getState().direction === -1);

    // The reversed spin unwinds the rotation the first 30 ticks built up
    const spunBackward = await stepFrames(page, 30);
    expect(spunBackward.rotation[0]).toBeLessThan(spunForward.rotation[0]);
});
