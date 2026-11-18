import { defineConfig, chromium } from '@playwright/test';
import process from 'node:process';

export default defineConfig({
    testDir: './tests/motion',
    fullyParallel: true,
    timeout: 30_000,
    use: {
        baseURL: 'http://127.0.0.1:5188',
        launchOptions: { executablePath: chromium.executablePath() },
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'npm run dev -- --host 127.0.0.1 --port 5188 --strictPort',
        url: 'http://127.0.0.1:5188/tests/fixtures/motion.html',
        reuseExistingServer: !process.env.CI,
    },
    reporter: 'list',
});
