import type { ListStatesResponse } from '@censo/contracts'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { getJson } from '@/shared/api'

// Lista das 27 UFs para a seleção (spec 002 FR-001).
export function useStates() {
    const query = useQuery({
        queryKey: ['states'],
        queryFn: ({ signal }) => getJson<ListStatesResponse>('/states', { signal }),
    })

    const states = computed(() => query.data.value?.items ?? [])

    return { states, isError: query.isError, retry: () => void query.refetch() }
}
