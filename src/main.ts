import './starter.css';

import type { AppElement, EntityElement } from '@playcanvas/web-components';
import { Script } from 'playcanvas';
import { whenReady } from '@playcanvas/web-components';

// Degrees per second the starter's cube spins around each axis
const ROTATE_SPEED = { axisX: 10, axisY: 20, axisZ: 30 };

// Spin direction multiplier: forwards by default, reversed by input
const FORWARD = 1;

class Rotate extends Script {
    public static scriptName = 'rotate';

    // Sign of the spin; clicking the cube (or a replay input) flips it
    public direction = FORWARD;

    public update(dt: number): void {
        const step = this.direction * dt;
        this.entity.rotate(ROTATE_SPEED.axisX * step, ROTATE_SPEED.axisY * step, ROTATE_SPEED.axisZ * step);
    }
}

// Engine scripts are resolved by the bundler, so they are attached through the entity rather than
// With <pc-script-instance name="...">, which only resolves scripts fetched at runtime by <pc-asset>
const appElement = await whenReady<AppElement>('pc-app');
const cube = await whenReady<EntityElement>('pc-entity[name="cube"]');

cube.entity?.addComponent('script');
const rotate = cube.entity?.script?.create(Rotate);

// <pc-app> dispatches pointer events on the entity under the pointer: clicking the cube reverses it
cube.addEventListener('pointerup', () => {
    if (rotate) {
        rotate.direction = -rotate.direction;
    }
});

// Test mode: ?test=1 on a dev server started with VITE_TEST_MODE=1 exposes window.__pcTestApi for
// Playwright — a manual clock plus state and input access for deterministic replay tests.
// Production builds never attach it.
const testMode = new URLSearchParams(globalThis.location.search).get('test') === '1';
if (import.meta.env.DEV && import.meta.env.VITE_TEST_MODE === '1' && testMode) {
    const { attachTestApi } = await import('./test-api');
    if (appElement.app && cube.entity && rotate) {
        attachTestApi({
            app: appElement.app,
            cube: cube.entity,
            getDirection: () => rotate.direction,
            reverseDirection: () => {
                rotate.direction = -rotate.direction;
            }
        });
    }
}
