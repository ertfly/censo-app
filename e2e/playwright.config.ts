import { defineConfig } from '@playwright/test'

// Dois projetos, um por stack do ADR 0020: "general" (compose.e2e.yaml) e
// "protection" (compose.e2e-protection.yaml, testes em tests/protection).
export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    retries: 0,
    reporter: [['list']],
    use: {
        baseURL: process.env.E2E_BASE_URL ?? 'http://frontend',
        locale: 'pt-BR',
        trace: 'retain-on-failure',
    },
    projects: [
        { name: 'general', testIgnore: 'protection/**' },
        { name: 'protection', testMatch: 'protection/**/*.spec.ts' },
    ],
})
