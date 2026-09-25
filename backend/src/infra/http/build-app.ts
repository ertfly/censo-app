import type { Writable } from 'node:stream'
import type { Kysely } from 'kysely'
import type { ProtectionConfig } from '../config/protection-config.js'
import type { Database } from '../database/database.types.js'
import { ProtectionEventLog } from '../logging/protection-event-log.js'
import { registerErrorHandler } from './error-handler.js'
import { UsedChallengeStore } from './protection/challenge-store.js'
import { type Clock, systemClock } from './protection/clock.js'
import { registerSessionGuard } from './protection/session.plugin.js'
import { sessionRoutes } from './protection/session.routes.js'
import { healthRoutes } from './routes/health.routes.js'
import { createServer } from './server.js'

export interface AppDependencies {
    db: Kysely<Database>
    protection: ProtectionConfig
    trustedProxyCidr: string
    clock?: Clock
    logStream?: Writable
}

// Monta o app completo; usado pelo main.ts e pelos testes, para os testes
// exercitarem exatamente a montagem de produção.
export async function buildApp(dependencies: AppDependencies) {
    const clock = dependencies.clock ?? systemClock
    const app = createServer({
        trustedProxyCidr: dependencies.trustedProxyCidr,
        logStream: dependencies.logStream,
    })
    registerErrorHandler(app)

    const eventLog = new ProtectionEventLog({
        dir: dependencies.protection.protectionLogDir,
        key: dependencies.protection.protectionLogKey,
        now: () => new Date(clock.now()),
        onError: (error) => app.log.warn({ err: error }, 'Could not write the protection log'),
    })
    const usedChallenges = new UsedChallengeStore({ maxEntries: 50_000, now: () => clock.now() })

    await registerSessionGuard(app, {
        sessionSecret: dependencies.protection.sessionSecret,
        clock,
    })
    await app.register(sessionRoutes, {
        config: dependencies.protection,
        clock,
        usedChallenges,
        eventLog,
    })
    await app.register(healthRoutes)

    return app
}

export type App = Awaited<ReturnType<typeof buildApp>>
