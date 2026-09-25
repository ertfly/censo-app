import { describe, expect, it } from 'vitest'
import { InvalidStateCodeError } from '#domain/errors/invalid-state-code.error.js'
import type { StateCode } from '#domain/value-objects/state-code.vo.js'
import { GetStateDensityRankingHandler } from '#application/queries/get-state-density-ranking/get-state-density-ranking.handler.js'
import type {
    StateRanking,
    StateRankingReader,
} from '#application/queries/get-state-density-ranking/state-ranking.reader.js'

const DISTRITO_FEDERAL: StateRanking = {
    state: { code: '53', abbreviation: 'DF', name: 'Distrito Federal' },
    totals: {
        population: 800,
        areaKm2: 10,
        populationDensity: 80,
        areaOutsideMunicipalitiesKm2: 0,
    },
    items: [
        {
            position: 1,
            code: '5300108',
            name: 'Brasília',
            population: 800,
            areaKm2: 10,
            populationDensity: 80,
        },
    ],
}

class FakeReader implements StateRankingReader {
    calls: string[] = []

    findByState(code: StateCode): Promise<StateRanking> {
        this.calls.push(code.value)
        return Promise.resolve(DISTRITO_FEDERAL)
    }
}

describe('GetStateDensityRankingHandler', () => {
    it('returns the ranking of the state', async () => {
        const reader = new FakeReader()
        const result = await new GetStateDensityRankingHandler(reader).execute({ stateCode: '53' })
        expect(reader.calls).toEqual(['53'])
        expect(result).toEqual(DISTRITO_FEDERAL)
    })

    it.each(['99', 'abc', '3', '310'])('rejects the invalid code "%s"', async (code) => {
        const reader = new FakeReader()
        await expect(
            new GetStateDensityRankingHandler(reader).execute({ stateCode: code }),
        ).rejects.toBeInstanceOf(InvalidStateCodeError)
        expect(reader.calls).toEqual([])
    })
})
