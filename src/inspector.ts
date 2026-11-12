// Loaded by the dev server only (see vite.config.ts), so production builds never include it
import './inspector.css';

import type { AppBase } from 'playcanvas';
import { Inspector } from '@playcanvas/inspector';

type Hook = {
    register?: (app: AppBase, info: object) => void;
    unregister?: (app: AppBase) => void;
};

// Every app announces itself to this hook as it starts, whichever format created it
const KEY = Symbol.for('playcanvas.inspector');
// Keep a hook installed earlier, such as a devtools extension's. Assertion through unknown.
// eslint-disable-next-line typescript/no-unsafe-type-assertion
const scope = globalThis as unknown as Record<symbol, Hook | undefined>;
// Keep a hook installed earlier, such as a devtools extension's
const prev = scope[KEY];

scope[KEY] = {
    register: (app: AppBase, info: object): void => {
        prev?.register?.(app, info);

        // Skip headless apps, such as the null apps @playcanvas/react creates for validation. Each
        // Panel destroys itself with its app
        if (!app.graphicsDevice.isNull) {
            // eslint-disable-next-line no-new -- Inspector registers itself globally; nothing to assign
            new Inspector(app, { visible: false });
        }
    },
    unregister: (app: AppBase): void => {
        prev?.unregister?.(app);
    }
};

// Key hint, a separate corner chip so the starter's own UI stays untouched
const hint = document.createElement('p');
hint.className = 'inspector-hint';
hint.innerHTML = '<kbd>`</kbd> inspector · <kbd>F9</kbd> pause · <kbd>F10</kbd> step';
document.body.append(hint);
