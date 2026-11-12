import './starter.css';

import type { EntityElement } from '@playcanvas/web-components';
import { Script } from 'playcanvas';
import { whenReady } from '@playcanvas/web-components';

// Degrees per second the starter's cube spins around each axis
const ROTATE_SPEED = { axisX: 10, axisY: 20, axisZ: 30 };

class Rotate extends Script {
    public static scriptName = 'rotate';

    public update(dt: number): void {
        this.entity.rotate(ROTATE_SPEED.axisX * dt, ROTATE_SPEED.axisY * dt, ROTATE_SPEED.axisZ * dt);
    }
}

// Engine scripts are resolved by the bundler, so they are attached through the entity rather than
// With <pc-script-instance name="...">, which only resolves scripts fetched at runtime by <pc-asset>
const cube = await whenReady<EntityElement>('pc-entity[name="cube"]');

cube.entity?.addComponent('script');
cube.entity?.script?.create(Rotate);
