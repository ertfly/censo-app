import type { Kysely } from 'kysely'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Database } from '#infra/database/database.types.js'
import { KyselyStatesReader } from '#infra/database/readers/kysely-states.reader.js'
import { createTestDatabase } from '../../helpers/create-test-database.js'

let db: Kysely<Database>

beforeAll(async () => {
    db = await createTestDatabase()
})

afterAll(async () => {
    await db.destroy()
})

describe('KyselyStatesReader', () => {
    it('lists the states with abbreviation, ordered by name in Portuguese', async () => {
        const states = await new KyselyStatesReader(db).listAll()
        expect(states).toEqual([
            { code: '29', abbreviation: 'BA', name: 'Bahia' },
            { code: '53', abbreviation: 'DF', name: 'Distrito Federal' },
            { code: '31', abbreviation: 'MG', name: 'Minas Gerais' },
            { code: '15', abbreviation: 'PA', name: 'Pará' },
            { code: '25', abbreviation: 'PB', name: 'Paraíba' },
            { code: '22', abbreviation: 'PI', name: 'Piauí' },
            { code: '43', abbreviation: 'RS', name: 'Rio Grande do Sul' },
            { code: '35', abbreviation: 'SP', name: 'São Paulo' },
            { code: '17', abbreviation: 'TO', name: 'Tocantins' },
        ])
    })
})
