import SQLite from 'better-sqlite3'
import type { Kysely } from 'kysely'
import { createKysely } from '#infra/database/connection.js'
import type { Database } from '#infra/database/database.types.js'
import { migrateToLatest } from '#infra/database/migrator.js'
import { insertCensusFixture } from '../fixtures/census.fixture.js'

// Banco SQLite em memória com o mesmo schema de produção (mesmas migrations) e os
// dados de teste. Nenhum teste usa o censo.sqlite (Princípio V).
export async function createTestDatabase(
    options: { withFixture?: boolean } = {},
): Promise<Kysely<Database>> {
    const db = createKysely(new SQLite(':memory:'))
    await migrateToLatest(db)
    if (options.withFixture ?? true) {
        await insertCensusFixture(db)
    }
    return db
}
