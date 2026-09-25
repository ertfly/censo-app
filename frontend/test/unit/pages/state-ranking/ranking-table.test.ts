import type { StateRanking } from '@censo/contracts'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import RankingTable from '@/pages/state-ranking/ui/RankingTable.vue'
import { resetSessionForTests } from '@/shared/api/session'

const MINAS: StateRanking = {
    state: { code: '31', abbreviation: 'MG', name: 'Minas Gerais' },
    totals: {
        population: 20_539_989,
        areaKm2: 586_513.98,
        populationDensity: 35.02,
        areaOutsideMunicipalitiesKm2: 0,
    },
    items: [
        {
            position: 1,
            code: '3106200',
            name: 'Belo Horizonte',
            population: 2_315_560,
            areaKm2: 331.354,
            populationDensity: 6988.1144,
        },
        {
            position: 2,
            code: '3136702',
            name: 'Juiz de Fora',
            population: 540_756,
            areaKm2: 1435.749,
            populationDensity: 376.636,
        },
    ],
}

beforeEach(() => {
    resetSessionForTests()
})

function mountTable() {
    return mount(RankingTable, { props: { ranking: MINAS } })
}

describe('RankingTable', () => {
    it('has the six column headers with scope="col"', () => {
        const headers = mountTable().findAll('thead th')
        expect(headers.map((header) => header.text())).toEqual([
            'Posição',
            'Município',
            'População',
            'Área (km²)',
            'Densidade (hab/km²)',
            'Escala',
        ])
        for (const header of headers) {
            expect(header.attributes('scope')).toBe('col')
        }
    })

    it('shows the numbers in the Brazilian format', () => {
        const cells = mountTable()
            .findAll('tbody tr')[0]!
            .findAll('td, th')
            .map((cell) => cell.text())
        expect(cells[0]).toContain('1')
        expect(cells[1]).toContain('Belo Horizonte')
        expect(cells[2]).toContain('2.315.560')
        expect(cells[3]).toContain('331,35')
        expect(cells[4]).toContain('6.988,11')
    })

    it('draws each row scale with the state density as reference', () => {
        const rows = mountTable().findAll('tbody tr')
        for (const row of rows) {
            expect(row.find('[data-density-scale="compact"]').exists()).toBe(true)
            expect(row.find('[data-density-reference]').exists()).toBe(true)
        }
    })

    it('keeps the rows read-only (FR-010)', () => {
        const body = mountTable().get('tbody')
        expect(body.findAll('a, button, [role="button"], [tabindex]')).toHaveLength(0)
    })

    it('filters by name and says when nothing matches', async () => {
        const wrapper = mountTable()
        const filter = wrapper.get('input')
        expect(wrapper.get(`label[for="${filter.attributes('id')}"]`).text()).toBe(
            'Filtrar municípios',
        )
        expect(wrapper.text()).toContain('2 municípios')

        await filter.setValue('juiz')
        expect(wrapper.findAll('tbody tr')).toHaveLength(1)
        expect(wrapper.get('tbody tr').text()).toContain('2')
        expect(wrapper.get('[aria-live="polite"]').text()).toBe('1 de 2 municípios')

        await filter.setValue('xyz')
        expect(wrapper.text()).toContain('Nenhum município de Minas Gerais corresponde a "xyz".')
    })
})
