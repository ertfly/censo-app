import type { StateRanking } from '@censo/contracts'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StateRecord from '@/pages/state-ranking/ui/StateRecord.vue'

const RIO_GRANDE_DO_SUL: StateRanking = {
    state: { code: '43', abbreviation: 'RS', name: 'Rio Grande do Sul' },
    totals: {
        population: 10_882_965,
        areaKm2: 281_707.1504883,
        populationDensity: 10_882_965 / 281_707.1504883,
        areaOutsideMunicipalitiesKm2: 13_085.864101,
    },
    items: [],
}

const MINAS: StateRanking = {
    state: { code: '31', abbreviation: 'MG', name: 'Minas Gerais' },
    totals: {
        population: 20_539_989,
        areaKm2: 586_513.983,
        populationDensity: 35.0204,
        areaOutsideMunicipalitiesKm2: 0,
    },
    items: [],
}

describe('StateRecord', () => {
    it('shows the title and the totals in the Brazilian format', () => {
        const wrapper = mount(StateRecord, { props: { ranking: RIO_GRANDE_DO_SUL } })
        expect(wrapper.get('h2').text()).toBe('Rio Grande do Sul/RS')
        expect(wrapper.get('[data-indicator="population"]').text()).toBe('10.882.965')
        expect(wrapper.get('[data-indicator="area"]').text()).toContain('281.707,15')
        expect(wrapper.get('[data-indicator="density"]').text()).toContain('38,63')
    })

    it('explains the area outside the municipalities when there is some', () => {
        const wrapper = mount(StateRecord, { props: { ranking: RIO_GRANDE_DO_SUL } })
        expect(wrapper.text()).toContain(
            'Inclui 13.085,86 km² fora dos municípios, registrados sem município na base do Censo.',
        )
    })

    it('has no note when all the area belongs to municipalities', () => {
        const wrapper = mount(StateRecord, { props: { ranking: MINAS } })
        expect(wrapper.text()).not.toContain('fora dos municípios')
    })

    it('places the state on the density scale', () => {
        const wrapper = mount(StateRecord, { props: { ranking: MINAS } })
        expect(wrapper.find('[data-density-scale] [data-density-marker]').exists()).toBe(true)
        expect(wrapper.get('[data-density-scale] figcaption').text()).toContain('35,02 hab/km²')
    })

    it('keeps the labels and hides the values while loading', () => {
        const wrapper = mount(StateRecord, {
            props: { ranking: null, label: 'Minas Gerais/MG' },
        })
        expect(wrapper.get('h2').text()).toBe('Minas Gerais/MG')
        for (const label of ['População', 'Área', 'Densidade demográfica']) {
            expect(wrapper.text()).toContain(label)
        }
        expect(wrapper.find('[data-indicator]').exists()).toBe(false)
    })
})
