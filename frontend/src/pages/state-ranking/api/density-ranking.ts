import type { StateRanking } from '@censo/contracts'
import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { ApiError, getJson } from '@/shared/api'

// Totais e ranking da UF pelo código da URL (spec 002 FR-002, FR-017, FR-018).

export type RankingStatus = 'idle' | 'loading' | 'error' | 'invalid-address' | 'success'

function fetchRanking(code: string, signal: AbortSignal): Promise<StateRanking> {
    return getJson(`/states/${encodeURIComponent(code)}/density-ranking`, { signal })
}

export function useStateDensityRanking(code: Ref<string | null>) {
    const query = useQuery({
        queryKey: computed(() => ['state-density-ranking', code.value] as const),
        queryFn: ({ queryKey, signal }) => fetchRanking(queryKey[1] ?? '', signal),
        enabled: computed(() => code.value !== null),
    })

    const status = computed<RankingStatus>(() => {
        if (code.value === null) {
            return 'idle'
        }
        if (query.isError.value && !query.isFetching.value) {
            const error = query.error.value
            return error instanceof ApiError && error.code === 'INVALID_STATE_CODE'
                ? 'invalid-address'
                : 'error'
        }
        return query.data.value && !query.isFetching.value ? 'success' : 'loading'
    })

    const ranking = computed(() => (status.value === 'success' ? query.data.value : null) ?? null)

    function retry(): void {
        void query.refetch()
    }

    return { status, ranking, error: query.error, retry }
}
