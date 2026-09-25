import type { MunicipalityIndicators } from '@censo/contracts'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MunicipalityRecord from '@/pages/municipality-search/ui/MunicipalityRecord.vue'

// Casos da base de teste do backend (census.fixture.ts).
const SAO_PAULO: MunicipalityIndicators = {
    code: '3550308',
    name: 'São Paulo',
    state: { code: '35', abbreviation: 'SP', name: 'São Paulo' },
    population: 1200,
    censusTractCount: 3,
    areaKm2: 10.7,
    populationDensity: 1200 / 10.7,
    areaTypeBreakdown: [
        { areaType: 'urban', censusTractCount: 1, population: 1000 },
        { areaType: 'rural', censusTractCount: 1, population: 200 },
        { areaType: 'unclassified', censusTractCount: 1, population: 0 },
    ],
    sexBreakdown: { men: 490, women: 510, unknown: 200 },
}

const PORTO_ALEGRE: MunicipalityIndicators = {
    code: '4314902',
    name: 'Porto Alegre',
    state: { code: '43', abbreviation: 'RS', name: 'Rio Grande do Sul' },
    population: 900,
    censusTractCount: 1,
    areaKm2: 3,
    populationDensity: 300,
    areaTypeBreakdown: [
        { areaType: 'urban', censusTractCount: 1, population: 900 },
        { areaType: 'rural', censusTractCount: 0, population: 0 },
    ],
    sexBreakdown: { men: 430, women: 470, unknown: 0 },
}

function mountRecord(indicators: MunicipalityIndicators) {
    return mount(MunicipalityRecord, { props: { indicators, status: 'success' } })
}

function percentages(wrapper: ReturnType<typeof mountRecord>, breakdown: string): string[] {
    return wrapper
        .get(`[data-breakdown="${breakdown}"]`)
        .findAll('[data-percent]')
        .map((cell) => cell.text())
}

function sum(values: string[]): number {
    return values.reduce(
        (total, value) => total + Number(value.replace('%', '').replace(',', '.')),
        0,
    )
}

describe('MunicipalityRecord', () => {
    it('shows the name as "Nome/SIGLA" and the main numbers in pt-BR', () => {
        const wrapper = mountRecord(SAO_PAULO)
        expect(wrapper.get('h2').text()).toBe('São Paulo/SP')
        const text = wrapper.text()
        expect(text).toContain('1.200')
        expect(text).toContain('10,70')
        expect(text).toContain('112,15')
    })

    it.each([
        ['area-type-tracts', ['33,3%', '33,3%', '33,4%']],
        ['area-type-population', ['83,3%', '16,7%', '0,0%']],
        ['sex', ['42,5%', '40,8%', '16,7%']],
    ])('makes the %s percentages add up to 100,0%%', (breakdown, expected) => {
        const values = percentages(mountRecord(SAO_PAULO), breakdown)
        expect(values).toEqual(expected)
        expect(sum(values)).toBeCloseTo(100, 5)
    })

    it('shows "Sem classificação" and "Sem informação" with the note when present', () => {
        const wrapper = mountRecord(SAO_PAULO)
        expect(wrapper.text()).toContain('Sem classificação')
        expect(wrapper.text()).toContain('Sem informação')
        expect(wrapper.text()).toContain(
            'Parte da população não tem informação de sexo na base do Censo.',
        )
    })

    it('hides "Sem classificação", "Sem informação" and the note when absent', () => {
        const wrapper = mountRecord(PORTO_ALEGRE)
        expect(wrapper.text()).not.toContain('Sem classificação')
        expect(wrapper.text()).not.toContain('Sem informação')
        expect(wrapper.text()).not.toContain('Parte da população')
        expect(percentages(wrapper, 'area-type-tracts')).toEqual(['100,0%', '0,0%'])
    })

    it('describes each bar in text for screen readers', () => {
        const wrapper = mountRecord(SAO_PAULO)
        const screenReaderText = wrapper
            .findAll('.sr-only')
            .map((element) => element.text())
            .join(' ')
        expect(screenReaderText).toContain('Urbano: 1 setor, 33,3%')
        expect(screenReaderText).toContain('Urbano: 1.000 pessoas, 83,3%')
        expect(screenReaderText).toContain('Mulheres: 510 pessoas, 42,5%')
        expect(screenReaderText).toContain('Sem informação: 200 pessoas, 16,7%')
    })

    it('keeps the labels and hides the values while loading', () => {
        const wrapper = mount(MunicipalityRecord, {
            props: { indicators: null, status: 'loading' },
        })
        expect(wrapper.text()).toContain('População')
        expect(wrapper.text()).toContain('Densidade demográfica')
        expect(wrapper.text()).not.toMatch(/\d/)
    })

    it('offers to try again on failure', async () => {
        const wrapper = mount(MunicipalityRecord, {
            props: { indicators: null, status: 'error', label: 'São Paulo/SP' },
        })
        expect(wrapper.text()).toContain('Não foi possível carregar os dados de São Paulo/SP.')
        await wrapper.get('button').trigger('click')
        expect(wrapper.emitted('retry')).toHaveLength(1)
    })
})
