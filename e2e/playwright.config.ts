import { defineConfig } from '@playwright/test'

// Dois projetos, um por stack do ADR 0020: "general" (compose.e2e.yaml) e
// "protection" (compose.e2e-protection.yaml, testes em tests/protection).
export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    // Um worker: todos os testes saem do mesmo IP, e um bloqueio afetaria os outros.
    workers: 1,
    retries: 0,
    reporter: [['list']],
    use: {
        // Os testes rodam na rede do container do frontend e acessam http://localhost:
        // a verificação usa a Web Crypto, que o navegador só libera em contexto seguro
        // (HTTPS ou localhost), como na execução local (ADR 0016).
        baseURL: process.env.E2E_BASE_URL ?? 'http://localhost',
        locale: 'pt-BR',
        trace: 'retain-on-failure',
    },
    projects: [
        { name: 'general', testIgnore: 'protection/**' },
        { name: 'protection', testMatch: 'protection/**/*.spec.ts' },
    ],
})
