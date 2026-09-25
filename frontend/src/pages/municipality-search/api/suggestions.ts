import type { MunicipalitySuggestion, SearchMunicipalitiesResponse } from '@censo/contracts'
import { useQuery } from '@tanstack/vue-query'
import { refDebounced } from '@vueuse/core'
import { computed, type Ref } from 'vue'
import { getJson } from '@/shared/api'

// Sugestões do autocomplete (spec 001 FR-002, FR-022).
const MIN_LENGTH = 2
const MAX_LENGTH = 60
const DEBOUNCE_MS = 250

export type SuggestionsStatus = 'idle' | 'loading' | 'error' | 'success'

// Termo enviado à API, ou null quando não se busca (menos de 2 ou mais de 60
// caracteres após remover os espaços das pontas).
export function suggestionTerm(text: string): string | null {
    const term = text.trim().replace(/\s+/gu, ' ')
    return term.length >= MIN_LENGTH && term.length <= MAX_LENGTH ? term : null
}

function fetchSuggestions(
    term: string,
    signal: AbortSignal,
): Promise<SearchMunicipalitiesResponse> {
    const query = new URLSearchParams({ q: term })
    return getJson(`/municipalities/suggestions?${query.toString()}`, { signal })
}

export function useMunicipalitySuggestions(text: Ref<string>) {
    const term = computed(() => suggestionTerm(text.value))
    const debouncedTerm = refDebounced(term, DEBOUNCE_MS)

    const query = useQuery({
        queryKey: computed(() => ['municipality-suggestions', debouncedTerm.value] as const),
        queryFn: ({ queryKey, signal }) => fetchSuggestions(queryKey[1] ?? '', signal),
        enabled: computed(() => debouncedTerm.value !== null),
    })

    // Só vale a resposta do termo que está no campo agora (FR-022).
    const isCurrent = computed(() => term.value !== null && term.value === debouncedTerm.value)

    const status = computed<SuggestionsStatus>(() => {
        if (term.value === null) {
            return 'idle'
        }
        if (!isCurrent.value || query.isFetching.value) {
            return 'loading'
        }
        if (query.isError.value) {
            return 'error'
        }
        return query.data.value ? 'success' : 'loading'
    })

    const items = computed<MunicipalitySuggestion[]>(() =>
        status.value === 'success' ? (query.data.value?.items ?? []) : [],
    )

    function retry(): void {
        void query.refetch()
    }

    return { term, status, items, retry }
}
