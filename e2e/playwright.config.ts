import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    retries: 0,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: process.env.E2E_BASE_URL ?? 'http://frontend',
        locale: 'pt-BR',
        trace: 'retain-on-failure',
    },
})
