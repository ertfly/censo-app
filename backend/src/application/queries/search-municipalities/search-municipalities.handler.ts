import type { SearchMunicipalitiesQuery, SearchMunicipalitiesResponse } from '@censo/contracts'
import { SearchTerm } from '#domain/value-objects/search-term.vo.js'
import type { MunicipalitySearchReader } from './municipality-search.reader.js'

const SUGGESTION_LIMIT = 10

// Sugestões do autocomplete (spec 001 FR-006: no máximo 10).
export class SearchMunicipalitiesHandler {
    constructor(private readonly reader: MunicipalitySearchReader) {}

    async execute(query: SearchMunicipalitiesQuery): Promise<SearchMunicipalitiesResponse> {
        const term = SearchTerm.create(query.q)
        return { items: await this.reader.search(term, SUGGESTION_LIMIT) }
    }
}
