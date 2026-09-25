import type { Kysely } from 'kysely'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { MunicipalityIndicators } from '#application/queries/get-municipality-indicators/municipality-indicators.reader.js'
import { MunicipalityCode } from '#domain/value-objects/municipality-code.vo.js'
import type { Database } from '#infra/database/database.types.js'
import { KyselyMunicipalityIndicatorsReader } from '#infra/database/readers/kysely-municipality-indicators.reader.js'
import { MUNICIPIOS } from '../../fixtures/census.fixture.js'
import { createTestDatabase } from '../../helpers/create-test-database.js'

let db: Kysely<Database>
let reader: KyselyMunicipalityIndicatorsReader

beforeAll(async () => {
    db = await createTestDatabase()
    reader = new KyselyMunicipalityIndicatorsReader(db)
})

afterAll(async () => {
    await db.destroy()
})

function find(code: string): Promise<MunicipalityIndicators | null> {
    return reader.findByCode(MunicipalityCode.create(code))
}

describe('KyselyMunicipalityIndicatorsReader', () => {
    it('sums the census tracts of the municipality', async () => {
        const saoPaulo = await find('3550308')
        expect(saoPaulo).toEqual({
            code: '3550308',
            name: 'São Paulo',
            state: { code: '35', abbreviation: 'SP', name: 'São Paulo' },
            population: 1200,
            censusTractCount: 3,
            areaKm2: expect.closeTo(10.7, 10) as number,
            populationDensity: expect.closeTo(1200 / 10.7, 10) as number,
            areaTypeBreakdown: [
                { areaType: 'urban', censusTractCount: 1, population: 1000 },
                { areaType: 'rural', censusTractCount: 1, population: 200 },
                { areaType: 'unclassified', censusTractCount: 1, population: 0 },
            ],
            sexBreakdown: { men: 490, women: 510, unknown: 200 },
        })
    })

    it('always lists urban and rural, and unclassified only when there are such tracts', async () => {
        const bomJesus = await find('2200001')
        expect(bomJesus?.areaTypeBreakdown).toEqual([
            { areaType: 'urban', censusTractCount: 1, population: 50 },
            { areaType: 'rural', censusTractCount: 0, population: 0 },
        ])
    })

    it('counts a missing sex value as unknown', async () => {
        const brasilia = await find('5300108')
        expect(brasilia?.sexBreakdown).toEqual({ men: 390, women: 50, unknown: 360 })
    })

    it('returns null for a valid code without a municipality', async () => {
        await expect(find('3500000')).resolves.toBeNull()
    })

    it.each(MUNICIPIOS.filter((row) => row.cd_mun !== '.').map((row) => row.cd_mun))(
        'keeps the invariants of the data model for %s',
        async (code) => {
            const indicators = await find(code)
            expect(indicators).not.toBeNull()
            const { sexBreakdown, areaTypeBreakdown } = indicators!
            expect(sexBreakdown.unknown).toBeGreaterThanOrEqual(0)
            expect(sexBreakdown.men + sexBreakdown.women + sexBreakdown.unknown).toBe(
                indicators!.population,
            )
            const tracts = areaTypeBreakdown.reduce((sum, item) => sum + item.censusTractCount, 0)
            const people = areaTypeBreakdown.reduce((sum, item) => sum + item.population, 0)
            expect(tracts).toBe(indicators!.censusTractCount)
            expect(people).toBe(indicators!.population)
            expect(indicators!.areaKm2).toBeGreaterThan(0)
        },
    )
})
