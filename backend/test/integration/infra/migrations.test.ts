import { sql } from 'kysely'
import { describe, expect, it } from 'vitest'
import { listPendingMigrations, migrateDown } from '#infra/database/migrator.js'
import { createTestDatabase } from '../../helpers/create-test-database.js'

describe('migrations', () => {
    it('creates the census schema from scratch', async () => {
        const db = await createTestDatabase({ withFixture: false })
        const tables = await sql<{ name: string }>`
            SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name
        `.execute(db)
        expect(tables.rows.map((row) => row.name)).toEqual(
            expect.arrayContaining(['demografia', 'municipio', 'setor', 'uf']),
        )
        await db.destroy()
    })

    it('has no pending migrations after migrating to latest', async () => {
        const db = await createTestDatabase({ withFixture: false })
        expect(await listPendingMigrations(db)).toEqual([])
        await db.destroy()
    })

    it('refuses to revert the baseline', async () => {
        const db = await createTestDatabase({ withFixture: false })
        await expect(migrateDown(db)).rejects.toThrow(/cannot be reverted/)
        await db.destroy()
    })

    it('loads the fixture respecting the foreign keys', async () => {
        const db = await createTestDatabase()
        const { count } = await db
            .selectFrom('setor')
            .select((eb) => eb.fn.countAll<number>().as('count'))
            .executeTakeFirstOrThrow()
        expect(count).toBe(13)
        await db.destroy()
    })
})
