import type { Kysely } from 'kysely'
import type { StateRanking } from '#application/queries/get-state-density-ranking/state-ranking.reader.js'
import type { StateRankingReader } from '#application/queries/get-state-density-ranking/state-ranking.reader.js'
import type { StateCode } from '#domain/value-objects/state-code.vo.js'
import type { Database } from '../database.types.js'

// Ranking por densidade (research R1 e R2 da 002). O filtro pelo intervalo de
// cd_setor usa a chave primária: o código do setor começa com o da UF. O
// registro "." (setores sem município) entra só nos totais.

const OUTSIDE_MUNICIPALITIES = '.'
const collator = new Intl.Collator('pt-BR')

export class KyselyStateRankingReader implements StateRankingReader {
    constructor(private readonly db: Kysely<Database>) {}

    async findByState(code: StateCode): Promise<StateRanking> {
        const state = await this.db
            .selectFrom('uf')
            .select(['cd_uf', 'nm_uf'])
            .where('cd_uf', '=', code.value)
            .executeTakeFirstOrThrow()

        const nextCode = String(Number(code.value) + 1).padStart(2, '0')
        const rows = await this.db
            .selectFrom('setor')
            .leftJoin('municipio', 'municipio.cd_mun', 'setor.cd_mun')
            .select((eb) => [
                'setor.cd_mun',
                'municipio.nm_mun',
                eb.fn.coalesce(eb.fn.sum<number>('setor.populacao'), eb.lit(0)).as('population'),
                eb.fn.coalesce(eb.fn.sum<number>('setor.area_km2'), eb.lit(0)).as('area'),
            ])
            .where('setor.cd_setor', '>=', code.value)
            .where('setor.cd_setor', '<', nextCode)
            .groupBy(['setor.cd_mun', 'municipio.nm_mun'])
            .execute()

        let population = 0
        let areaKm2 = 0
        let areaOutsideMunicipalitiesKm2 = 0
        const municipalities: Omit<StateRanking['items'][number], 'position'>[] = []
        for (const row of rows) {
            const rowPopulation = Number(row.population)
            const rowArea = Number(row.area)
            population += rowPopulation
            areaKm2 += rowArea
            if (row.cd_mun === OUTSIDE_MUNICIPALITIES || !row.nm_mun) {
                areaOutsideMunicipalitiesKm2 += rowArea
                continue
            }
            municipalities.push({
                code: row.cd_mun,
                name: row.nm_mun,
                population: rowPopulation,
                areaKm2: rowArea,
                populationDensity: rowArea > 0 ? rowPopulation / rowArea : 0,
            })
        }

        const items = municipalities
            .sort(
                (a, b) =>
                    b.populationDensity - a.populationDensity || collator.compare(a.name, b.name),
            )
            .map((item, index) => ({ position: index + 1, ...item }))

        return {
            state: { code: state.cd_uf, abbreviation: code.abbreviation, name: state.nm_uf },
            totals: {
                population,
                areaKm2,
                populationDensity: areaKm2 > 0 ? population / areaKm2 : 0,
                areaOutsideMunicipalitiesKm2,
            },
            items,
        }
    }
}
