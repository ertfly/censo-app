import { describe, expect, it } from 'vitest'
import {
    formatDecimal2,
    formatDensity,
    formatInteger,
    formatKm2,
    formatPercent1,
} from '@/shared/lib/format'

describe('pt-BR number formatting', () => {
    it('formats counts without decimals and with thousands separator', () => {
        expect(formatInteger(203080756)).toBe('203.080.756')
        expect(formatInteger(853)).toBe('853')
        expect(formatInteger(1433)).toBe('1.433')
    })

    it('formats decimals with 2 places and comma', () => {
        expect(formatDecimal2(0.54)).toBe('0,54')
        expect(formatDecimal2(13416.961814)).toBe('13.416,96')
        expect(formatDecimal2(0.1537938)).toBe('0,15')
    })

    it('formats area and density with units', () => {
        expect(formatKm2(0.54)).toBe('0,54 km²')
        expect(formatKm2(281707.1504883)).toBe('281.707,15 km²')
        expect(formatDensity(1433.51)).toBe('1.433,51 hab/km²')
    })

    it('formats percentages with 1 decimal', () => {
        expect(formatPercent1(51.5)).toBe('51,5%')
        expect(formatPercent1(100)).toBe('100,0%')
        expect(formatPercent1(0)).toBe('0,0%')
    })
})
