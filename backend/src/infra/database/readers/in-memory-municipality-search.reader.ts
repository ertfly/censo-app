import type { Kysely } from 'kysely'
import type {
    MunicipalitySearchReader,
    MunicipalitySuggestion,
} from '#application/queries/search-municipalities/municipality-search.reader.js'
import { StateCode } from '#domain/value-objects/state-code.vo.js'
import type { SearchTerm } from '#domain/value-objects/search-term.vo.js'
import type { Database, MunicipioTable } from '../database.types.js'

// Índice de busca em memória (research R1 da 001): o LIKE do SQLite não ignora
// acentos, e os 5.570 nomes cabem em memória (carga de ~2 ms).

const collator = new Intl.Collator('pt-BR')

interface IndexedMunicipality {
    suggestion: MunicipalitySuggestion
}

export class InMemoryMunicipalitySearchReader implements MunicipalitySearchReader {
    private constructor(private readonly municipalities: IndexedMunicipality[]) {}

    static async load(db: Kysely<Database>): Promise<InMemoryMunicipalitySearchReader> {
        const rows = await db
            .selectFrom('municipio')
            .select(['cd_mun', 'nm_mun', 'cd_uf'])
            .where('cd_mun', '!=', '.')
            .where('nm_mun', '!=', '')
            .execute()
        return InMemoryMunicipalitySearchReader.fromRows(rows)
    }

    static fromRows(rows: MunicipioTable[]): InMemoryMunicipalitySearchReader {
        return new InMemoryMunicipalitySearchReader(
            rows
                .filter((row) => row.cd_mun !== '.' && row.nm_mun !== '')
                .map((row) => ({
                    suggestion: {
                        code: row.cd_mun,
                        name: row.nm_mun,
                        stateCode: row.cd_uf,
                        stateAbbreviation: StateCode.create(row.cd_uf).abbreviation,
                    },
                })),
        )
    }

    search(term: SearchTerm, limit: number): Promise<MunicipalitySuggestion[]> {
        const matches = this.municipalities
            .filter(({ suggestion }) => term.matchesWordStartOf(suggestion.name))
            .map(({ suggestion }) => ({
                suggestion,
                startsName: term.startsNameOf(suggestion.name),
            }))
            .sort(
                (a, b) =>
                    Number(b.startsName) - Number(a.startsName) ||
                    collator.compare(a.suggestion.name, b.suggestion.name) ||
                    a.suggestion.stateAbbreviation.localeCompare(b.suggestion.stateAbbreviation),
            )
            .slice(0, limit)
            .map(({ suggestion }) => suggestion)
        return Promise.resolve(matches)
    }
}
