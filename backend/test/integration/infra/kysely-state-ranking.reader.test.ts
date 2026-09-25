import type { Kysely } from 'kysely'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { StateRanking } from '#application/queries/get-state-density-ranking/state-ranking.reader.js'
import { StateCode } from '#domain/value-objects/state-code.vo.js'
import type { Database } from '#infra/database/database.types.js'
import { KyselyStateRankingReader } from '#infra/database/readers/kysely-state-ranking.reader.js'
import { UFS } from '../../fixtures/census.fixture.js'
import { createTestDatabase } from '../../helpers/create-test-database.js'

let db: Kysely<Database>
let reader: KyselyStateRankingReader

beforeAll(async () => {
    db = await createTestDatabase()
    reader = new KyselyStateRankingReader(db)
})

afterAll(async () => {
    await db.destroy()
})

function find(code: string): Promise<StateRanking> {
    return reader.findByState(StateCode.create(code))
}

describe('KyselyStateRankingReader', () => {
    it('ranks the municipalities by density, breaking exact ties by name in Portuguese', async () => {
        const ranking = await find('31')
        expect(ranking.state).toEqual({ code: '31', abbreviation: 'MG', name: 'Minas Gerais' })
        expect(ranking.items.map((item) => [item.position, item.name])).toEqual([
            [1, 'Belo Horizonte'],
            [2, 'Água Boa'],
            [3, 'Aguaí'],
            [4, 'Serra Rural'],
        ])
        expect(ranking.items[0]).toEqual({
            position: 1,
            code: '3106200',
            name: 'Belo Horizonte',
            population: 5000,
            areaKm2: 1,
            populationDensity: 5000,
        })
        expect(ranking.totals).toEqual({
            population: 5350,
            areaKm2: 551,
            populationDensity: 5350 / 551,
            areaOutsideMunicipalitiesKm2: 0,
        })
    })

    it('keeps the "." record out of the ranking but inside the totals', async () => {
        const ranking = await find('43')
        expect(ranking.items.map((item) => item.name)).toEqual(['Porto Alegre'])
        expect(ranking.totals.areaOutsideMunicipalitiesKm2).toBeCloseTo(13085.864101, 6)
        expect(ranking.totals.areaKm2).toBeCloseTo(13088.864101, 6)
        expect(ranking.totals.population).toBe(900)
    })

    it('lists the single municipality of the Distrito Federal', async () => {
        const ranking = await find('53')
        expect(ranking.items).toHaveLength(1)
        expect(ranking.items[0]).toMatchObject({ position: 1, name: 'Brasília' })
    })

    it.each(UFS.map((uf) => uf.cd_uf))(
        'keeps the invariants of the data model for %s',
        async (code) => {
            const { items, totals } = await find(code)
            const population = items.reduce((sum, item) => sum + item.population, 0)
            const area = items.reduce((sum, item) => sum + item.areaKm2, 0)
            expect(population).toBe(totals.population)
            expect(area + totals.areaOutsideMunicipalitiesKm2).toBeCloseTo(totals.areaKm2, 6)
            expect(items.map((item) => item.position)).toEqual(items.map((_, index) => index + 1))
            for (let index = 1; index < items.length; index += 1) {
                expect(items[index]!.populationDensity).toBeLessThanOrEqual(
                    items[index - 1]!.populationDensity,
                )
            }
            if (code !== '43') {
                expect(totals.areaOutsideMunicipalitiesKm2).toBe(0)
            }
        },
    )
})
