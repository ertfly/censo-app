import { loadProtectionConfig, ProtectionConfigError } from '#infra/config/protection-config.js'
import { withStoredSecrets } from '#infra/config/stored-secrets.js'
import { openDatabase } from '#infra/database/connection.js'
import { checkDatabaseFile, DatabaseFileError } from '#infra/database/database-file-check.js'
import { listPendingMigrations } from '#infra/database/migrator.js'
import { buildApp } from '#infra/http/build-app.js'
import { startProtectionLogRetention } from '#infra/logging/protection-log-retention.js'

// Composition root: única parte que conhece todas as camadas (ADR 0008).

const databasePath = process.env['DATABASE_PATH'] ?? '../censo.sqlite'
const port = Number(process.env['PORT'] ?? 3000)
const trustedProxyCidr = process.env['TRUSTED_PROXY_CIDR'] ?? '172.28.0.0/24'
const isProduction = process.env['NODE_ENV'] === 'production'
const secretsDir = process.env['SECRETS_DIR'] ?? '/var/lib/censo/secrets'

function exitWith(message: string): never {
    console.error(message)
    process.exit(1)
}

let protection
try {
    checkDatabaseFile(databasePath)
    // Sem as variáveis, os segredos vêm do volume ou são gerados (ADR 0024).
    protection = loadProtectionConfig(withStoredSecrets(process.env, secretsDir))
} catch (error) {
    if (error instanceof DatabaseFileError || error instanceof ProtectionConfigError) {
        exitWith(error.message)
    }
    throw error
}

// A aplicação só lê o banco (ADR 0007).
const db = openDatabase({ path: databasePath, readonly: true })

const pendingMigrations = await listPendingMigrations(db)
if (pendingMigrations.length > 0) {
    const message = `Pending migrations: ${pendingMigrations.join(', ')}. Run "npm run migrate".`
    if (isProduction) {
        exitWith(message)
    }
    console.warn(message)
}

const app = await buildApp({ db, protection, trustedProxyCidr })
const stopRetention = startProtectionLogRetention(
    protection.protectionLogDir,
    protection.protectionLogRetentionDays,
)

const shutdown = async (): Promise<void> => {
    stopRetention()
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
