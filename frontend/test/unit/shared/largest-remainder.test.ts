import { describe, expect, it } from 'vitest'
import { toPercentages } from '@/shared/lib/largest-remainder'

function sum(values: number[]): number {
    return Math.round(values.reduce((total, value) => total + value, 0) * 10) / 10
}

describe('toPercentages (largest remainder, 1 decimal)', () => {
    it('sums exactly 100.0 where simple rounding gives 99.9', () => {
        const result = toPercentages([1, 1, 1])
        expect(result).toEqual([33.4, 33.3, 33.3])
        expect(sum(result)).toBe(100)
    })

    it('sums exactly 100.0 where simple rounding gives 100.1', () => {
        const values = [1, 1, 1, 1, 1, 1]
        expect(sum(values.map((value) => Math.round((value / 6) * 1000) / 10))).toBe(100.2)
        expect(sum(toPercentages(values))).toBe(100)
    })

    it('keeps exact values untouched', () => {
        expect(toPercentages([490, 510])).toEqual([49, 51])
    })

    it('handles a real split with missing data', () => {
        const result = toPercentages([545035, 594012, 1200])
        expect(sum(result)).toBe(100)
        expect(result[2]).toBe(0.1)
    })

    it('returns zeros when the total is zero', () => {
        expect(toPercentages([0, 0])).toEqual([0, 0])
    })
})
