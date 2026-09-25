import type { RankingItem } from '@censo/contracts'
import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useRankingFilter } from '@/pages/state-ranking/model/use-ranking-filter'

function item(position: number, name: string): RankingItem {
    return {
        position,
        code: String(3100000 + position),
        name,
        population: 1000,
        areaKm2: 10,
        populationDensity: 100 - position,
    }
}

const MINAS = [
    item(1, 'Belo Horizonte'),
    item(2, 'Contagem'),
    item(3, 'Juiz de Fora'),
    item(4, 'Água Boa'),
    item(5, 'Aguaí'),
]

describe('useRankingFilter', () => {
    it('lists every municipality without a term', () => {
        const filter = useRankingFilter(ref(MINAS), ref('31'))
        expect(filter.visibleItems.value).toHaveLength(5)
        expect(filter.countLabel.value).toBe('5 municípios')
    })

    it('filters from the first character, keeping the ranking position', () => {
        const filter = useRankingFilter(ref(MINAS), ref('31'))
        filter.term.value = 'j'
        expect(filter.visibleItems.value.map((row) => [row.position, row.name])).toEqual([
            [3, 'Juiz de Fora'],
        ])
        expect(filter.countLabel.value).toBe('1 de 5 municípios')
    })

    it('ignores accents and case', () => {
        const filter = useRankingFilter(ref(MINAS), ref('31'))
        filter.term.value = 'AGUA'
        expect(filter.visibleItems.value.map((row) => row.position)).toEqual([4, 5])
        expect(filter.countLabel.value).toBe('2 de 5 municípios')
    })

    it('reports no match', () => {
        const filter = useRankingFilter(ref(MINAS), ref('31'))
        filter.term.value = 'xyz'
        expect(filter.visibleItems.value).toEqual([])
        expect(filter.countLabel.value).toBe('0 de 5 municípios')
        expect(filter.hasNoMatch.value).toBe(true)
    })

    it('uses the singular for a state with one municipality', () => {
        const filter = useRankingFilter(ref([item(1, 'Brasília')]), ref('53'))
        expect(filter.countLabel.value).toBe('1 município')
    })

    it('clears the term when the state changes', async () => {
        const stateCode = ref<string | null>('31')
        const filter = useRankingFilter(ref(MINAS), stateCode)
        filter.term.value = 'juiz'
        stateCode.value = '35'
        await nextTick()
        expect(filter.term.value).toBe('')
    })
})
