// Situação do setor censitário (glossário em conventions.md): Urbana, Rural ou
// sem classificação na base.
export const AreaType = {
    Urban: 'urban',
    Rural: 'rural',
    Unclassified: 'unclassified',
} as const

export type AreaType = (typeof AreaType)[keyof typeof AreaType]
