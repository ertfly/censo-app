import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadProtectionConfig, type ProtectionConfig } from '#infra/config/protection-config.js'
import { type App, buildApp } from '#infra/http/build-app.js'
import { systemClock } from '#infra/http/protection/clock.js'
import { createTestDatabase } from './create-test-database.js'

// Relógio controlado pelo teste, para simular expiração e bloqueio. Parte da hora
// real: o verifySolution do altcha-lib confere a expiração pelo relógio real.
export class TestClock {
    private current = Date.now()

    now(): number {
        return this.current
    }

    advance(milliseconds: number): void {
        this.current += milliseconds
    }
}

export interface TestServer {
    app: App
    clock: TestClock
    logDir: string
    config: ProtectionConfig
    close(): Promise<void>
}

export interface TestServerOptions {
    env?: Record<string, string>
    // Rota protegida só para testes, antes de existirem as rotas das features.
    withProtectedRoute?: boolean
    // Usa Date.now (para testes com vi.useFakeTimers, junto com o @fastify/rate-limit).
    useSystemClock?: boolean
    trustedProxyCidr?: string
}

// Servidor completo (mesma montagem do main.ts) sobre o banco de teste, com
// segredos só de teste e dificuldade baixa. Não existe modo que desligue a
// proteção (research R8 da 003).
export async function createTestServer(options: TestServerOptions = {}): Promise<TestServer> {
    const logDir = mkdtempSync(join(tmpdir(), 'protection-log-'))
    const config = loadProtectionConfig({
        ALTCHA_HMAC_KEY: 'test-altcha-hmac-key-000000000000000',
        SESSION_SECRET: 'test-session-secret-0000000000000000',
        PROTECTION_LOG_KEY: 'test-protection-log-key-00000000000',
        ALTCHA_COST: '1',
        ALTCHA_COUNTER_MAX: '10',
        PROTECTION_LOG_DIR: logDir,
        ...options.env,
    })
    const clock = new TestClock()
    const db = await createTestDatabase()
    const app = await buildApp({
        db,
        protection: config,
        trustedProxyCidr: options.trustedProxyCidr ?? '127.0.0.1',
        clock: options.useSystemClock ? systemClock : clock,
    })
    if (options.withProtectedRoute) {
        app.get('/api/test-protected', () => ({ ok: true }))
    }
    await app.ready()

    return {
        app,
        clock,
        logDir,
        config,
        async close() {
            await app.close()
            await db.destroy()
        },
    }
}
