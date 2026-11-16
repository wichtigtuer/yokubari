import { none, some } from './utils/result';
import type { Option } from './utils/result';

/** The domain actions a key press can mean (spec §5). */
export type InputAction = 'cursor-left' | 'cursor-right' | 'soft-drop' | 'start' | 'swap';

/** How the shell wants input delivered: discrete actions, plus soft drop as a held state. */
export type InputHandlers = Readonly<{
    onAction: (action: InputAction) => void;
    onSoftDrop: (active: boolean) => void;
}>;

const KEY_ACTIONS: Readonly<Record<string, InputAction>> = {
    ArrowDown: 'soft-drop',
    ArrowLeft: 'cursor-left',
    ArrowRight: 'cursor-right',
    Enter: 'start',
    Space: 'swap'
};

/** The action a key maps to, if any (spec §5). Pure, so the mapping is unit-testable. */
export function actionForKey(key: string): Option<InputAction> {
    if (!Object.hasOwn(KEY_ACTIONS, key)) {
        return none();
    }
    return some(KEY_ACTIONS[key]);
}

/**
 * Routes keyboard input into domain actions. OS key repeat is filtered for the discrete actions —
 * one swap per press (spec §5) — while soft drop tracks the key's held state via keydown/keyup.
 * Returns a detach function.
 */
export function attachInput(target: Window, handlers: InputHandlers): () => void {
    const onKeyDown = (event: KeyboardEvent): void => {
        const action = actionForKey(event.key);
        if (action.type === 'none') {
            return;
        }
        event.preventDefault();
        if (action.value === 'soft-drop') {
            handlers.onSoftDrop(true);
            return;
        }
        if (!event.repeat) {
            handlers.onAction(action.value);
        }
    };
    const onKeyUp = (event: KeyboardEvent): void => {
        if (event.key === 'ArrowDown') {
            handlers.onSoftDrop(false);
        }
    };
    target.addEventListener('keydown', onKeyDown);
    target.addEventListener('keyup', onKeyUp);
    return () => {
        target.removeEventListener('keydown', onKeyDown);
        target.removeEventListener('keyup', onKeyUp);
    };
}
