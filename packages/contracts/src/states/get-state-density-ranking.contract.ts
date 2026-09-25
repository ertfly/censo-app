import { type Static, Type } from 'typebox'
import { StateSummary } from './list-states.contract.js'

// Totais da UF e ranking dos municípios por densidade (spec 002 FR-002 a
// FR-009, contracts/api.md). Decimais sem arredondamento.
export const GetStateDensityRankingParams = Type.Object({
    stateCode: Type.String(),
})
export type GetStateDensityRankingParams = Static<typeof GetStateDensityRankingParams>

export const RankingItem = Type.Object({
    position: Type.Integer(),
    code: Type.String(),
    name: Type.String(),
    population: Type.Integer(),
    areaKm2: Type.Number(),
    populationDensity: Type.Number(),
})
export type RankingItem = Static<typeof RankingItem>

export const StateRanking = Type.Object({
    state: StateSummary,
    totals: Type.Object({
        population: Type.Integer(),
        areaKm2: Type.Number(),
        populationDensity: Type.Number(),
        // Área dos setores sem município nomeado (registro "." do RS).
        areaOutsideMunicipalitiesKm2: Type.Number(),
    }),
    items: Type.Array(RankingItem),
})
export type StateRanking = Static<typeof StateRanking>
