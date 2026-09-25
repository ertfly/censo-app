// Régua logarítmica de densidade (design-system.md, "Forma"): de 0,1 a
// 100.000 hab/km², cada potência de dez com o mesmo comprimento.

export const DENSITY_MIN = 0.1
export const DENSITY_MAX = 100_000
export const DENSITY_TICKS = [1, 10, 100, 1000, 10_000] as const

const LOG_MIN = Math.log10(DENSITY_MIN)
const LOG_SPAN = Math.log10(DENSITY_MAX) - LOG_MIN

// Posição de 0 a 1 na régua; valores fora do intervalo ficam nas pontas.
export function densityPosition(value: number): number {
    if (!(value > DENSITY_MIN)) {
        return 0
    }
    if (value >= DENSITY_MAX) {
        return 1
    }
    return (Math.log10(value) - LOG_MIN) / LOG_SPAN
}

const tickFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

export function formatDensityTick(value: number): string {
    return tickFormat.format(value)
}
