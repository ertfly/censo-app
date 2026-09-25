import { type Static, Type } from 'typebox'

// Lista das 27 UFs, ordenada pelo nome (spec 002 FR-001, contracts/api.md).
export const StateSummary = Type.Object({
    code: Type.String(),
    abbreviation: Type.String(),
    name: Type.String(),
})
export type StateSummary = Static<typeof StateSummary>

export const ListStatesResponse = Type.Object({
    items: Type.Array(StateSummary),
})
export type ListStatesResponse = Static<typeof ListStatesResponse>
