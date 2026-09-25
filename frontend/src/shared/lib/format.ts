// Formato brasileiro para números exibidos (conventions.md; spec 001 FR-012).

const integerFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const decimal2Format = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})
const percent1Format = new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
})

export function formatInteger(value: number): string {
    return integerFormat.format(value)
}

export function formatDecimal2(value: number): string {
    return decimal2Format.format(value)
}

// Recebe o percentual de 0 a 100.
export function formatPercent1(value: number): string {
    return percent1Format.format(value / 100)
}

export function formatKm2(value: number): string {
    return `${formatDecimal2(value)} km²`
}

export function formatDensity(value: number): string {
    return `${formatDecimal2(value)} hab/km²`
}
