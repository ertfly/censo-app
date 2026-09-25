// Percentuais com 1 casa decimal que somam exatamente 100,0 (research R4 da 001):
// arredonda para baixo em décimos e distribui os décimos restantes para as
// maiores frações.
export function toPercentages(values: number[]): number[] {
    const total = values.reduce((sum, value) => sum + value, 0)
    if (total === 0) {
        return values.map(() => 0)
    }

    const tenths = values.map((value) => (value / total) * 1000)
    const floors = tenths.map((value) => Math.floor(value))
    let missing = 1000 - floors.reduce((sum, value) => sum + value, 0)

    const byRemainder = tenths
        .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
        .sort((a, b) => b.remainder - a.remainder || a.index - b.index)

    for (const { index } of byRemainder) {
        if (missing === 0) {
            break
        }
        floors[index] = (floors[index] ?? 0) + 1
        missing -= 1
    }

    return floors.map((value) => value / 10)
}
