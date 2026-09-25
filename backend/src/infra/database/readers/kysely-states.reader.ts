import type { Kysely } from 'kysely'
import type { StateSummary, StatesReader } from '#application/queries/list-states/states.reader.js'
import { StateCode } from '#domain/value-objects/state-code.vo.js'
import type { Database } from '../database.types.js'

const collator = new Intl.Collator('pt-BR')

// UFs com a sigla completada pelo StateCode (a base não tem sigla).
export class KyselyStatesReader implements StatesReader {
    constructor(private readonly db: Kysely<Database>) {}

    async listAll(): Promise<StateSummary[]> {
        const rows = await this.db.selectFrom('uf').select(['cd_uf', 'nm_uf']).execute()
        return rows
            .map((row) => ({
                code: row.cd_uf,
                abbreviation: StateCode.create(row.cd_uf).abbreviation,
                name: row.nm_uf,
            }))
            .sort((a, b) => collator.compare(a.name, b.name))
    }
}
