/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Set by the Playwright webServer so `?test=1` attaches `window.__pcTestApi` (src/main.ts) */
    readonly VITE_TEST_MODE?: string;
}

declare module 'playcanvas/scripts/esm/camera-controls.mjs' {
    import type { Script } from 'playcanvas';

    export const CameraControls: typeof Script & (new () => Script);
}

declare module 'playcanvas/scripts/esm/grid.mjs' {
    import type { Script } from 'playcanvas';

    export const Grid: typeof Script & (new () => Script);
}

declare module 'playcanvas/scripts/esm/sky/procedural-sky.mjs' {
    import type { Script } from 'playcanvas';

    export const ProceduralSky: typeof Script & (new () => Script);
}
