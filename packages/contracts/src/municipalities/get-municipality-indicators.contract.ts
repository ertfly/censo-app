import { type Static, Type } from 'typebox'

// Indicadores do município (spec 001 FR-009 a FR-012, contracts/api.md).
export const GetMunicipalityIndicatorsParams = Type.Object({
    municipalityCode: Type.String(),
})
export type GetMunicipalityIndicatorsParams = Static<typeof GetMunicipalityIndicatorsParams>

export const AreaTypeValue = Type.Union([
    Type.Literal('urban'),
    Type.Literal('rural'),
    Type.Literal('unclassified'),
])
export type AreaTypeValue = Static<typeof AreaTypeValue>

export const MunicipalityIndicators = Type.Object({
    code: Type.String(),
    name: Type.String(),
    state: Type.Object({
        code: Type.String(),
        abbreviation: Type.String(),
        name: Type.String(),
    }),
    population: Type.Integer(),
    censusTractCount: Type.Integer(),
    // Sem arredondamento; a formatação é do frontend.
    areaKm2: Type.Number(),
    populationDensity: Type.Number(),
    // Sempre com urban e rural; unclassified só quando houver setores sem classificação.
    areaTypeBreakdown: Type.Array(
        Type.Object({
            areaType: AreaTypeValue,
            censusTractCount: Type.Integer(),
            population: Type.Integer(),
        }),
    ),
    sexBreakdown: Type.Object({
        men: Type.Integer(),
        women: Type.Integer(),
        unknown: Type.Integer(),
    }),
})
export type MunicipalityIndicators = Static<typeof MunicipalityIndicators>
