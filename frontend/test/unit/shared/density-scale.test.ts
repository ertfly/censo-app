import { describe, expect, it } from 'vitest'
import {
    DENSITY_MAX,
    DENSITY_MIN,
    DENSITY_TICKS,
    densityPosition,
    formatDensityTick,
} from '@/shared/ui/density-scale/density-scale'

describe('densityPosition', () => {
    it('places 0,1 at the start and 100.000 at the end of the scale', () => {
        expect(DENSITY_MIN).toBe(0.1)
        expect(DENSITY_MAX).toBe(100_000)
        expect(densityPosition(0.1)).toBe(0)
        expect(densityPosition(100_000)).toBe(1)
    })

    it('uses a logarithmic scale: each power of ten takes the same length', () => {
        expect(densityPosition(1)).toBeCloseTo(1 / 6, 10)
        expect(densityPosition(100)).toBeCloseTo(3 / 6, 10)
        expect(densityPosition(10_000)).toBeCloseTo(5 / 6, 10)
    })

    it('places the extreme values of the country inside the scale', () => {
        expect(densityPosition(0.15)).toBeCloseTo((Math.log10(0.15) + 1) / 6, 10)
        expect(densityPosition(0.15)).toBeGreaterThan(0)
        expect(densityPosition(13_417)).toBeCloseTo((Math.log10(13_417) + 1) / 6, 10)
        expect(densityPosition(13_417)).toBeLessThan(1)
    })

    it('keeps values outside the range at the ends', () => {
        expect(densityPosition(0)).toBe(0)
        expect(densityPosition(0.01)).toBe(0)
        expect(densityPosition(1_000_000)).toBe(1)
    })
})

describe('ticks', () => {
    it('marks 1, 10, 100, 1.000 and 10.000 with pt-BR labels', () => {
        expect(DENSITY_TICKS).toEqual([1, 10, 100, 1000, 10_000])
        expect(DENSITY_TICKS.map(formatDensityTick)).toEqual(['1', '10', '100', '1.000', '10.000'])
        expect(formatDensityTick(DENSITY_MIN)).toBe('0,1')
        expect(formatDensityTick(DENSITY_MAX)).toBe('100.000')
    })
})
