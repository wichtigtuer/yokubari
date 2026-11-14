import '@playcanvas/web-components';

import { describe, expect, it } from 'vite-plus/test';
import { Vec3 } from 'playcanvas';

describe('playcanvas in the browser', () => {
    it('registers the pc-app custom element', () => {
        expect(customElements.get('pc-app')).toBeDefined();
    });

    it('runs engine math', () => {
        const vec = new Vec3(1, 2, 3).addScalar(1);
        expect([vec.x, vec.y, vec.z]).toEqual([2, 3, 4]);
    });
});
