import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';

const XVFB_DISPLAY = ':99';
const XVFB_SOCKET = `/tmp/.X11-unix/X${XVFB_DISPLAY.slice(1)}`;
const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 720;
const SCREEN_DEPTH = 24;
const POLL_MS = 50;
const TIMEOUT_MS = 5000;

// True when running on a headless Linux host: Firefox cannot create a WebGL device in headless
// Mode there, so the firefox project runs headed against a virtual display instead
const needsXvfb = (): boolean => process.platform === 'linux' && !process.env.DISPLAY;

const xvfb: { current?: ChildProcess } = {};

// Wait until Xvfb's socket appears, polling instead of a fixed sleep
const waitForSocket = async (): Promise<void> => {
    const deadline = Date.now() + TIMEOUT_MS;
    while (!existsSync(XVFB_SOCKET)) {
        if (Date.now() > deadline) {
            throw new Error(`Xvfb did not create ${XVFB_SOCKET} within ${TIMEOUT_MS}ms`);
        }
        await new Promise((resolve) => {
            setTimeout(resolve, POLL_MS);
        });
    }
};

const globalSetup = async (): Promise<void> => {
    if (!needsXvfb()) {
        return;
    }
    xvfb.current = spawn('Xvfb', [XVFB_DISPLAY, '-screen', '0', `${SCREEN_WIDTH}x${SCREEN_HEIGHT}x${SCREEN_DEPTH}`], {
        stdio: 'ignore'
    });
    xvfb.current.on('error', (error: Error) => {
        throw new Error(`Firefox E2E on headless Linux needs Xvfb (apt install xvfb): ${error.message}`);
    });
    await waitForSocket();
    // Workers inherit the runner's environment, so their browsers find the virtual display
    process.env.DISPLAY = XVFB_DISPLAY;
};

export const stopXvfb = (): void => {
    xvfb.current?.kill();
    delete xvfb.current;
};

export default globalSetup;
