import { type Static, Type } from 'typebox'

// Sugestões do autocomplete (spec 001 FR-002 a FR-008, contracts/api.md).
export const SearchMunicipalitiesQuery = Type.Object({
    q: Type.String(),
})
export type SearchMunicipalitiesQuery = Static<typeof SearchMunicipalitiesQuery>

export const MunicipalitySuggestion = Type.Object({
    code: Type.String(),
    name: Type.String(),
    stateCode: Type.String(),
    stateAbbreviation: Type.String(),
})
export type MunicipalitySuggestion = Static<typeof MunicipalitySuggestion>

export const SearchMunicipalitiesResponse = Type.Object({
    items: Type.Array(MunicipalitySuggestion),
})
export type SearchMunicipalitiesResponse = Static<typeof SearchMunicipalitiesResponse>
