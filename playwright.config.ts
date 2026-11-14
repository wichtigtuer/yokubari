import { defineConfig, devices } from '@playwright/test';

const ONE = 1;
const TWO = 2;
const ZERO = 0;
const PORT = 5173;

// Headless Firefox cannot create a WebGL device on headless Linux, so e2e/global-setup.ts starts
// Xvfb there and this project runs headed against the virtual display
const firefoxHeadless = !(process.platform === 'linux' && !process.env.DISPLAY);

export default defineConfig({
    globalSetup: './e2e/global-setup.ts',
    globalTeardown: './e2e/global-teardown.ts',
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'], headless: firefoxHeadless }
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] }
        },
        /* Test against mobile viewports. */
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] }
        },
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] }
        }
    ],
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: process.env.CI ? 'github' : 'html',
    retries: process.env.CI ? TWO : ZERO,
    testDir: 'e2e',
    // Ignore vitest tests
    testIgnore: '*.test.ts',
    // Run E2E specs
    testMatch: '*.spec.ts',
    use: {
        baseURL: `http://localhost:${PORT}`,
        headless: true,
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        /* Create videos if Playwright fails on first retry */
        video: 'on-first-retry'
    },
    webServer: {
        // VITE_COVERAGE instruments src/ with istanbul (see vite.config.ts); VITE_TEST_MODE lets
        // ?test=1 attach window.__pcTestApi (see src/main.ts)
        command: `pnpm exec vp dev --port ${PORT} --strictPort`,
        env: {
            VITE_COVERAGE: 'true',
            VITE_TEST_MODE: '1'
        },
        port: PORT,
        reuseExistingServer: !process.env.CI
    },
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? ONE : undefined
});
