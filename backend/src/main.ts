import { openDatabase } from '#infra/database/connection.js'
import { checkDatabaseFile, DatabaseFileError } from '#infra/database/database-file-check.js'
import { listPendingMigrations } from '#infra/database/migrator.js'
import { registerErrorHandler } from '#infra/http/error-handler.js'
import { healthRoutes } from '#infra/http/routes/health.routes.js'
import { createServer } from '#infra/http/server.js'

// Composition root: única parte que conhece todas as camadas (ADR 0008).

const databasePath = process.env['DATABASE_PATH'] ?? '../censo.sqlite'
const port = Number(process.env['PORT'] ?? 3000)
const trustedProxyCidr = process.env['TRUSTED_PROXY_CIDR'] ?? '172.28.0.0/24'
const isProduction = process.env['NODE_ENV'] === 'production'

try {
    checkDatabaseFile(databasePath)
} catch (error) {
    if (error instanceof DatabaseFileError) {
        console.error(error.message)
        process.exit(1)
    }
    throw error
}

// A aplicação só lê o banco (ADR 0007).
const db = openDatabase({ path: databasePath, readonly: true })

const pendingMigrations = await listPendingMigrations(db)
if (pendingMigrations.length > 0) {
    const message = `Pending migrations: ${pendingMigrations.join(', ')}. Run "npm run migrate".`
    if (isProduction) {
        console.error(message)
        process.exit(1)
    }
    console.warn(message)
}

const app = createServer({ trustedProxyCidr })
registerErrorHandler(app)
await app.register(healthRoutes)

const shutdown = async (): Promise<void> => {
    await app.close()
    await db.destroy()
    process.exit(0)
}
process.on('SIGTERM', () => void shutdown())
process.on('SIGINT', () => void shutdown())

// A mensagem padrão traz o IP do container; os logs não devem ter endereço algum (ADR 0019).
await app.listen({
    host: '0.0.0.0',
    port,
    listenTextResolver: () => `Server listening on port ${port}`,
})
