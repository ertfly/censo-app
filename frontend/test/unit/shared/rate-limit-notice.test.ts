import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { getJson } from '@/shared/api/http-client'
import { queriesBlocked, resetSessionForTests } from '@/shared/api/session'
import ProtectionNotice from '@/widgets/app-header/ui/ProtectionNotice.vue'

vi.mock('@/widgets/app-header/lib/load-altcha', () => ({ loadAltcha: () => Promise.resolve() }))

beforeEach(() => {
    vi.useFakeTimers()
    resetSessionForTests()
    localStorage.setItem('censo:session-expires-at', String(Date.now() + 60 * 60 * 1000))
})

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

function blockedResponse(): Response {
    return new Response(JSON.stringify({ code: 'RATE_LIMIT_EXCEEDED', retryAfterSeconds: 3 }), {
        status: 429,
    })
}

describe('rate limit notice', () => {
    it('shows the countdown, blocks queries and does not retry by itself', async () => {
        const fetchMock = vi.fn(() => Promise.resolve(blockedResponse()))
        vi.stubGlobal('fetch', fetchMock)
        const wrapper = mount(ProtectionNotice)

        await expect(getJson('/states')).rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED' })
        await nextTick()

        const alert = wrapper.get('[role="alert"]')
        expect(alert.text()).toContain('Você fez muitas consultas em pouco tempo.')
        expect(alert.text()).toContain('Aguarde 3 segundos para consultar de novo.')
        expect(queriesBlocked.value).toBe(true)

        await vi.advanceTimersByTimeAsync(1000)
        expect(wrapper.text()).toContain('Aguarde 2 segundos')

        await vi.advanceTimersByTimeAsync(2000)
        expect(wrapper.find('[role="alert"]').exists()).toBe(false)
        expect(queriesBlocked.value).toBe(false)
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('announces only the start and the end to screen readers', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(blockedResponse())),
        )
        const wrapper = mount(ProtectionNotice)
        await getJson('/states').catch(() => undefined)
        await nextTick()

        // O número que muda a cada segundo fica fora da árvore de acessibilidade.
        expect(wrapper.get('[data-countdown]').attributes('aria-hidden')).toBe('true')
        expect(wrapper.get('.sr-only').text()).toContain('Aguarde 3 segundos')

        await vi.advanceTimersByTimeAsync(3000)
        expect(wrapper.get('[aria-live="polite"]').text()).toBe('Você já pode consultar de novo.')
    })
})
