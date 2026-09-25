import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import {
    suggestionTerm,
    useMunicipalitySuggestions,
} from '@/pages/municipality-search/api/suggestions'
import { resetSessionForTests } from '@/shared/api/session'

interface Deferred {
    url: string
    resolve: (names: string[]) => void
}

let requests: Deferred[] = []

function suggestion(name: string) {
    return { code: '3550308', name, stateCode: '35', stateAbbreviation: 'SP' }
}

// Cada chamada ao fetch fica pendente até o teste decidir a resposta.
function stubFetch(): void {
    requests = []
    vi.stubGlobal(
        'fetch',
        vi.fn(
            (url: string) =>
                new Promise<Response>((resolve) => {
                    requests.push({
                        url,
                        resolve: (names) =>
                            resolve(
                                new Response(JSON.stringify({ items: names.map(suggestion) }), {
                                    status: 200,
                                }),
                            ),
                    })
                }),
        ),
    )
}

function mountSuggestions() {
    const input = ref('')
    let result!: ReturnType<typeof useMunicipalitySuggestions>
    const Host = defineComponent({
        setup() {
            result = useMunicipalitySuggestions(input)
            return () => h('div')
        },
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mount(Host, { global: { plugins: [[VueQueryPlugin, { queryClient }]] } })
    return { input, result: () => result }
}

async function flush(): Promise<void> {
    for (let index = 0; index < 5; index += 1) {
        await Promise.resolve()
        await nextTick()
    }
}

beforeEach(() => {
    vi.useFakeTimers()
    resetSessionForTests()
    localStorage.setItem('censo:session-expires-at', String(Date.now() + 3_600_000))
    stubFetch()
})

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

describe('suggestionTerm', () => {
    it('trims, collapses spaces and accepts 2 to 60 characters', () => {
        expect(suggestionTerm('  sao   pau ')).toBe('sao pau')
        expect(suggestionTerm('sa')).toBe('sa')
        expect(suggestionTerm('a'.repeat(60))).toBe('a'.repeat(60))
    })

    it('rejects terms shorter than 2 or longer than 60 characters', () => {
        expect(suggestionTerm('')).toBeNull()
        expect(suggestionTerm(' s ')).toBeNull()
        expect(suggestionTerm('a'.repeat(61))).toBeNull()
    })
})

describe('useMunicipalitySuggestions', () => {
    it('waits 250 ms after the last keystroke before asking the API', async () => {
        const { input } = mountSuggestions()
        input.value = 'sa'
        await flush()
        input.value = 'sao'
        await flush()
        vi.advanceTimersByTime(249)
        await flush()
        expect(fetch).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1)
        await flush()
        expect(fetch).toHaveBeenCalledTimes(1)
        expect(requests[0]?.url).toBe('/api/municipalities/suggestions?q=sao')
    })

    it('does not ask the API for 1 character', async () => {
        const { input, result } = mountSuggestions()
        input.value = ' s '
        await flush()
        vi.advanceTimersByTime(500)
        await flush()
        expect(fetch).not.toHaveBeenCalled()
        expect(result().status.value).toBe('idle')
    })

    it('does not ask the API nor report an error above 60 characters', async () => {
        const { input, result } = mountSuggestions()
        input.value = 'a'.repeat(61)
        await flush()
        vi.advanceTimersByTime(500)
        await flush()
        expect(fetch).not.toHaveBeenCalled()
        expect(result().status.value).toBe('idle')
        expect(result().items.value).toEqual([])
    })

    it('shows loading while waiting and the items of the current term', async () => {
        const { input, result } = mountSuggestions()
        input.value = 'sao'
        await flush()
        expect(result().status.value).toBe('loading')

        vi.advanceTimersByTime(250)
        await flush()
        requests[0]?.resolve(['São Paulo'])
        await flush()
        expect(result().status.value).toBe('success')
        expect(result().items.value.map((item) => item.name)).toEqual(['São Paulo'])
    })

    it('discards the answer of a previous term (FR-022)', async () => {
        const { input, result } = mountSuggestions()
        input.value = 'sao'
        await flush()
        vi.advanceTimersByTime(250)
        await flush()

        input.value = 'sao p'
        await flush()
        vi.advanceTimersByTime(250)
        await flush()
        expect(requests).toHaveLength(2)

        // A resposta do termo anterior chega depois: não aparece.
        requests[0]?.resolve(['Santo Antônio', 'São Paulo'])
        await flush()
        expect(result().items.value).toEqual([])
        expect(result().status.value).toBe('loading')

        requests[1]?.resolve(['São Paulo'])
        await flush()
        expect(result().items.value.map((item) => item.name)).toEqual(['São Paulo'])
    })

    it('hides the previous items as soon as the text changes', async () => {
        const { input, result } = mountSuggestions()
        input.value = 'sao'
        await flush()
        vi.advanceTimersByTime(250)
        await flush()
        requests[0]?.resolve(['São Paulo'])
        await flush()

        input.value = 'sao x'
        await flush()
        expect(result().items.value).toEqual([])
        expect(result().status.value).toBe('loading')
    })
})
