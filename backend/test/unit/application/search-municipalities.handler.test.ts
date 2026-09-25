import { describe, expect, it } from 'vitest'
import { InvalidSearchTermError } from '#domain/errors/invalid-search-term.error.js'
import type { SearchTerm } from '#domain/value-objects/search-term.vo.js'
import { SearchMunicipalitiesHandler } from '#application/queries/search-municipalities/search-municipalities.handler.js'
import type {
    MunicipalitySearchReader,
    MunicipalitySuggestion,
} from '#application/queries/search-municipalities/municipality-search.reader.js'

class FakeReader implements MunicipalitySearchReader {
    calls: { term: string; limit: number }[] = []

    search(term: SearchTerm, limit: number): Promise<MunicipalitySuggestion[]> {
        this.calls.push({ term: term.normalized, limit })
        return Promise.resolve([
            { code: '3550308', name: 'São Paulo', stateCode: '35', stateAbbreviation: 'SP' },
        ])
    }
}

describe('SearchMunicipalitiesHandler', () => {
    it('turns the query into a SearchTerm and asks for 10 suggestions', async () => {
        const reader = new FakeReader()
        const result = await new SearchMunicipalitiesHandler(reader).execute({ q: ' São  Pau ' })
        expect(reader.calls).toEqual([{ term: 'sao pau', limit: 10 }])
        expect(result).toEqual({
            items: [
                { code: '3550308', name: 'São Paulo', stateCode: '35', stateAbbreviation: 'SP' },
            ],
        })
    })

    it('rejects an invalid term before reading', async () => {
        const reader = new FakeReader()
        await expect(new SearchMunicipalitiesHandler(reader).execute({ q: 's' })).rejects.toThrow(
            InvalidSearchTermError,
        )
        expect(reader.calls).toEqual([])
    })
})
