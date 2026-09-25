import type { MunicipalitySuggestion } from '@censo/contracts'
import type { SearchTerm } from '#domain/value-objects/search-term.vo.js'

export type { MunicipalitySuggestion }

// Porta de leitura da busca de municípios (ADR 0008).
export interface MunicipalitySearchReader {
    search(term: SearchTerm, limit: number): Promise<MunicipalitySuggestion[]>
}
