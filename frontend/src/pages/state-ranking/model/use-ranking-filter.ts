import type { RankingItem } from '@censo/contracts'
import { computed, ref, type Ref, watch } from 'vue'
import { formatInteger } from '@/shared/lib/format'
import { matchesWordStart } from '@/shared/lib/text-search'

// Filtro por nome sobre o ranking já carregado (spec 002 FR-019 a FR-023): as
// linhas mantêm a posição do ranking completo, e o termo é limpo ao trocar de UF.
export function useRankingFilter(items: Ref<RankingItem[]>, stateCode: Ref<string | null>) {
    const term = ref('')

    watch(stateCode, () => {
        term.value = ''
    })

    const isFiltering = computed(() => term.value.trim() !== '')

    const visibleItems = computed(() =>
        isFiltering.value
            ? items.value.filter((item) => matchesWordStart(item.name, term.value))
            : items.value,
    )

    const countLabel = computed(() => {
        const total = items.value.length
        const unit = total === 1 ? 'município' : 'municípios'
        return isFiltering.value
            ? `${formatInteger(visibleItems.value.length)} de ${formatInteger(total)} ${unit}`
            : `${formatInteger(total)} ${unit}`
    })

    const hasNoMatch = computed(() => isFiltering.value && visibleItems.value.length === 0)

    return { term, visibleItems, countLabel, hasNoMatch }
}
