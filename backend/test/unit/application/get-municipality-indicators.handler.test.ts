import { describe, expect, it } from 'vitest'
import { InvalidMunicipalityCodeError } from '#domain/errors/invalid-municipality-code.error.js'
import { MunicipalityNotFoundError } from '#domain/errors/municipality-not-found.error.js'
import type { MunicipalityCode } from '#domain/value-objects/municipality-code.vo.js'
import { GetMunicipalityIndicatorsHandler } from '#application/queries/get-municipality-indicators/get-municipality-indicators.handler.js'
import type {
    MunicipalityIndicators,
    MunicipalityIndicatorsReader,
} from '#application/queries/get-municipality-indicators/municipality-indicators.reader.js'

const SAO_PAULO: MunicipalityIndicators = {
    code: '3550308',
    name: 'São Paulo',
    state: { code: '35', abbreviation: 'SP', name: 'São Paulo' },
    population: 1200,
    censusTractCount: 3,
    areaKm2: 10.7,
    populationDensity: 1200 / 10.7,
    areaTypeBreakdown: [
        { areaType: 'urban', censusTractCount: 1, population: 1000 },
        { areaType: 'rural', censusTractCount: 1, population: 200 },
        { areaType: 'unclassified', censusTractCount: 1, population: 0 },
    ],
    sexBreakdown: { men: 490, women: 510, unknown: 200 },
}

class FakeReader implements MunicipalityIndicatorsReader {
    calls: string[] = []

    constructor(private readonly result: MunicipalityIndicators | null) {}

    findByCode(code: MunicipalityCode): Promise<MunicipalityIndicators | null> {
        this.calls.push(code.value)
        return Promise.resolve(this.result)
    }
}

describe('GetMunicipalityIndicatorsHandler', () => {
    it('returns the indicators of the municipality', async () => {
        const reader = new FakeReader(SAO_PAULO)
        const result = await new GetMunicipalityIndicatorsHandler(reader).execute({
            municipalityCode: '3550308',
        })
        expect(reader.calls).toEqual(['3550308'])
        expect(result).toEqual(SAO_PAULO)
    })

    it.each(['abc', '123', '9999999'])('rejects the invalid code "%s"', async (code) => {
        const reader = new FakeReader(SAO_PAULO)
        await expect(
            new GetMunicipalityIndicatorsHandler(reader).execute({ municipalityCode: code }),
        ).rejects.toBeInstanceOf(InvalidMunicipalityCodeError)
        expect(reader.calls).toEqual([])
    })

    it('reports a valid code without a municipality as not found', async () => {
        const error = await new GetMunicipalityIndicatorsHandler(new FakeReader(null))
            .execute({ municipalityCode: '3500000' })
            .catch((caught: unknown) => caught)
        expect(error).toBeInstanceOf(MunicipalityNotFoundError)
        expect(error).toMatchObject({ code: 'MUNICIPALITY_NOT_FOUND', kind: 'not_found' })
    })
})
