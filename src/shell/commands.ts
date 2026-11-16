import { none, some } from '../utils/result';
import type { InputAction } from '../input';
import type { Option } from '../utils/result';
import type { Shell } from './session';
import { dispatchAction } from './session';

// Commands the test API's dispatchInput accepts (input.ts actions plus held-state edges)
type ShellCommand = InputAction | 'soft-drop-off' | 'soft-drop-on';
const SHELL_COMMANDS: readonly ShellCommand[] = [
    'cursor-left',
    'cursor-right',
    'soft-drop',
    'soft-drop-off',
    'soft-drop-on',
    'start',
    'swap'
];

/** Parses a dispatchInput string into a command; unknown strings are a no-op. */
function parseCommand(input: string): Option<ShellCommand> {
    const found = SHELL_COMMANDS.filter((candidate) => candidate === input);
    if (found.length === 0) {
        return none();
    }
    return some(found[0]);
}

/** Routes one test-API command string into the shell. */
export function dispatchCommand(shell: Shell, input: string): void {
    const command = parseCommand(input);
    if (command.type === 'none') {
        return;
    }
    if (command.value === 'soft-drop-on') {
        shell.softDrop = true;
        return;
    }
    if (command.value === 'soft-drop-off') {
        shell.softDrop = false;
        return;
    }
    dispatchAction(shell, command.value);
}
