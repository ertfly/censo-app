import type { Kysely } from 'kysely'
import { type Migration, type MigrationProvider, Migrator } from 'kysely/migration'
import * as baseline from './migrations/0001-baseline.js'

// Lista explícita: dev (.ts), build (.js) e testes carregam as mesmas migrations,
// sem depender de varrer a pasta (ADR 0015).
const MIGRATIONS: Record<string, Migration> = {
    '0001-baseline': baseline,
}

class StaticMigrationProvider implements MigrationProvider {
    getMigrations(): Promise<Record<string, Migration>> {
        return Promise.resolve(MIGRATIONS)
    }
}

function createMigrator(db: Kysely<unknown>): Migrator {
    return new Migrator({ db, provider: new StaticMigrationProvider() })
}

export async function migrateToLatest(db: Kysely<unknown>): Promise<string[]> {
    const { error, results } = await createMigrator(db).migrateToLatest()
    if (error) {
        throw error instanceof Error ? error : new Error(String(error))
    }
    return (results ?? []).map((result) => result.migrationName)
}

export async function migrateDown(db: Kysely<unknown>): Promise<string[]> {
    const { error, results } = await createMigrator(db).migrateDown()
    if (error) {
        throw error instanceof Error ? error : new Error(String(error))
    }
    return (results ?? []).map((result) => result.migrationName)
}

export async function listPendingMigrations(db: Kysely<unknown>): Promise<string[]> {
    const migrations = await createMigrator(db).getMigrations()
    return migrations
        .filter((migration) => migration.executedAt === undefined)
        .map((migration) => migration.name)
}
