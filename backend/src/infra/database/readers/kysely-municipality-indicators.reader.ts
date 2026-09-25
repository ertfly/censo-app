import type { Kysely } from 'kysely'
import type {
    MunicipalityIndicators,
    MunicipalityIndicatorsReader,
} from '#application/queries/get-municipality-indicators/municipality-indicators.reader.js'
import { AreaType } from '#domain/value-objects/area-type.vo.js'
import type { MunicipalityCode } from '#domain/value-objects/municipality-code.vo.js'
import type { Database } from '../database.types.js'

// Indicadores somados a partir dos setores (research R2 e R3 da 001). O filtro
// pelo intervalo de cd_setor usa a chave primária: o código do setor começa com
// o do município.

const AREA_TYPE_BY_SITUACAO: Record<string, AreaType> = {
    Urbana: AreaType.Urban,
    Rural: AreaType.Rural,
}

type AreaTypeRow = MunicipalityIndicators['areaTypeBreakdown'][number]

export class KyselyMunicipalityIndicatorsReader implements MunicipalityIndicatorsReader {
    constructor(private readonly db: Kysely<Database>) {}

    async findByCode(code: MunicipalityCode): Promise<MunicipalityIndicators | null> {
        const municipality = await this.db
            .selectFrom('municipio')
            .innerJoin('uf', 'uf.cd_uf', 'municipio.cd_uf')
            .select(['municipio.cd_mun', 'municipio.nm_mun', 'uf.cd_uf', 'uf.nm_uf'])
            .where('municipio.cd_mun', '=', code.value)
            .where('municipio.nm_mun', '!=', '')
            .executeTakeFirst()
        if (!municipality) {
            return null
        }

        const nextCode = String(Number(code.value) + 1)
        const groups = await this.db
            .selectFrom('setor')
            .leftJoin('demografia', 'demografia.cd_setor', 'setor.cd_setor')
            .select((eb) => [
                'setor.situacao',
                eb.fn.countAll<number>().as('tracts'),
                eb.fn.coalesce(eb.fn.sum<number>('setor.populacao'), eb.lit(0)).as('population'),
                eb.fn.coalesce(eb.fn.sum<number>('setor.area_km2'), eb.lit(0)).as('area'),
                eb.fn.sum<number>(eb.fn.coalesce('demografia.homens', eb.lit(0))).as('men'),
                eb.fn.sum<number>(eb.fn.coalesce('demografia.mulheres', eb.lit(0))).as('women'),
            ])
            .where('setor.cd_setor', '>=', code.value)
            .where('setor.cd_setor', '<', nextCode)
            .where('setor.cd_mun', '=', code.value)
            .groupBy('setor.situacao')
            .execute()

        const breakdown = new Map<AreaType, AreaTypeRow>([
            [AreaType.Urban, { areaType: AreaType.Urban, censusTractCount: 0, population: 0 }],
            [AreaType.Rural, { areaType: AreaType.Rural, censusTractCount: 0, population: 0 }],
        ])
        let population = 0
        let censusTractCount = 0
        let areaKm2 = 0
        let men = 0
        let women = 0
        for (const group of groups) {
            const areaType =
                (group.situacao && AREA_TYPE_BY_SITUACAO[group.situacao]) || AreaType.Unclassified
            const row = breakdown.get(areaType) ?? {
                areaType,
                censusTractCount: 0,
                population: 0,
            }
            row.censusTractCount += Number(group.tracts)
            row.population += Number(group.population)
            breakdown.set(areaType, row)

            censusTractCount += Number(group.tracts)
            population += Number(group.population)
            areaKm2 += Number(group.area)
            men += Number(group.men)
            women += Number(group.women)
        }

        return {
            code: municipality.cd_mun,
            name: municipality.nm_mun,
            state: {
                code: municipality.cd_uf,
                abbreviation: code.stateCode.abbreviation,
                name: municipality.nm_uf,
            },
            population,
            censusTractCount,
            areaKm2,
            populationDensity: areaKm2 > 0 ? population / areaKm2 : 0,
            areaTypeBreakdown: [...breakdown.values()],
            sexBreakdown: { men, women, unknown: population - men - women },
        }
    }
}
