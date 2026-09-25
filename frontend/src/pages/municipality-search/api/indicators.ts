import type { MunicipalityIndicators } from '@censo/contracts'
import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { ApiError, getJson } from '@/shared/api'

// Ficha do município pelo código da URL (spec 001 FR-009, FR-017, FR-018).

export type IndicatorsStatus = 'idle' | 'loading' | 'error' | 'invalid-address' | 'success'

const INVALID_ADDRESS_CODES = new Set(['INVALID_MUNICIPALITY_CODE', 'MUNICIPALITY_NOT_FOUND'])

function fetchIndicators(code: string, signal: AbortSignal): Promise<MunicipalityIndicators> {
    return getJson(`/municipalities/${encodeURIComponent(code)}`, { signal })
}

export function useMunicipalityIndicators(code: Ref<string | null>) {
    const query = useQuery({
        queryKey: computed(() => ['municipality-indicators', code.value] as const),
        queryFn: ({ queryKey, signal }) => fetchIndicators(queryKey[1] ?? '', signal),
        enabled: computed(() => code.value !== null),
    })

    const status = computed<IndicatorsStatus>(() => {
        if (code.value === null) {
            return 'idle'
        }
        if (query.isError.value && !query.isFetching.value) {
            const error = query.error.value
            return error instanceof ApiError && INVALID_ADDRESS_CODES.has(error.code)
                ? 'invalid-address'
                : 'error'
        }
        return query.data.value && !query.isFetching.value ? 'success' : 'loading'
    })

    const indicators = computed(
        () => (status.value === 'success' ? query.data.value : null) ?? null,
    )

    function retry(): void {
        void query.refetch()
    }

    return { status, indicators, error: query.error, retry }
}
