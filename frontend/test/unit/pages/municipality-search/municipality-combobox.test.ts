import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import MunicipalityCombobox from '@/pages/municipality-search/ui/MunicipalityCombobox.vue'
import {
    markRateLimited,
    resetSessionForTests,
    setVerificationStateForTests,
} from '@/shared/api/session'

type Answer = { items: string[][] } | { status: number }

// Resposta do fetch por termo: [nome, sigla]. Sem resposta definida, fica pendente.
let answers: Record<string, Answer> = {}

function stubFetch(): void {
    vi.stubGlobal(
        'fetch',
        vi.fn((url: string) => {
            const term = new URL(url, 'http://localhost').searchParams.get('q') ?? ''
            const answer = answers[term]
            if (!answer) {
                return new Promise<Response>(() => undefined)
            }
            if ('status' in answer) {
                return Promise.resolve(
                    new Response(JSON.stringify({ code: 'INTERNAL_ERROR' }), {
                        status: answer.status,
                    }),
                )
            }
            const items = answer.items.map(([name, abbreviation], index) => ({
                code: String(3550300 + index),
                name,
                stateCode: '35',
                stateAbbreviation: abbreviation,
            }))
            return Promise.resolve(new Response(JSON.stringify({ items }), { status: 200 }))
        }),
    )
}

let wrapper: VueWrapper | null = null

function mountCombobox() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    wrapper = mount(MunicipalityCombobox, {
        attachTo: document.body,
        global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    })
    return wrapper
}

async function settle(): Promise<void> {
    for (let index = 0; index < 10; index += 1) {
        await Promise.resolve()
        await nextTick()
    }
}

async function type(text: string): Promise<void> {
    const input = wrapper!.get('input')
    await input.trigger('focus')
    await input.setValue(text)
    await settle()
    vi.advanceTimersByTime(250)
    await settle()
}

async function press(key: string): Promise<void> {
    await wrapper!.get('input').trigger('keydown', { key })
    await settle()
}

function listText(): string {
    return document.body.querySelector('[role="listbox"]')?.textContent ?? ''
}

function options(): HTMLElement[] {
    return [...document.body.querySelectorAll<HTMLElement>('[role="option"]')]
}

beforeEach(() => {
    vi.useFakeTimers()
    resetSessionForTests()
    localStorage.setItem('censo:session-expires-at', String(Date.now() + 3_600_000))
    answers = {}
    stubFetch()
})

afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

describe('MunicipalityCombobox', () => {
    it('has the "Município" label', () => {
        mountCombobox()
        const input = wrapper!.get('input')
        const label = wrapper!.get(`label[for="${input.attributes('id')}"]`)
        expect(label.text()).toBe('Município')
    })

    it('lists suggestions as "Nome/SIGLA" with the typed part in bold', async () => {
        answers['sao'] = {
            items: [
                ['São Paulo', 'SP'],
                ['São Paulo de Olivença', 'AM'],
            ],
        }
        mountCombobox()
        await type('sao')
        expect(options().map((option) => option.textContent?.trim())).toEqual([
            'São Paulo/SP',
            'São Paulo de Olivença/AM',
        ])
        expect(options()[0]?.querySelector('b')?.textContent).toBe('São')
    })

    it('announces how many suggestions there are', async () => {
        answers['sao'] = {
            items: [
                ['São Paulo', 'SP'],
                ['São Carlos', 'SP'],
            ],
        }
        mountCombobox()
        await type('sao')
        expect(wrapper!.get('[aria-live="polite"]').text()).toBe('2 municípios encontrados.')
    })

    it('moves through suggestions with the arrow keys and chooses with Enter', async () => {
        answers['sao'] = {
            items: [
                ['São Paulo', 'SP'],
                ['São Carlos', 'SP'],
                ['São Vicente', 'SP'],
            ],
        }
        mountCombobox()
        await type('sao')
        await press('ArrowDown')
        const first = options().findIndex((option) => option.hasAttribute('data-highlighted'))
        await press('ArrowDown')
        const second = options().findIndex((option) => option.hasAttribute('data-highlighted'))
        expect(second).toBe(first + 1)

        await press('Enter')
        const chosen = wrapper!.emitted('select')?.[0]?.[0] as { name: string }
        expect(chosen.name).toBe(['São Paulo', 'São Carlos', 'São Vicente'][second])
    })

    it('chooses the first suggestion on Enter without a highlight', async () => {
        answers['bom jesus'] = {
            items: [
                ['Bom Jesus', 'PB'],
                ['Bom Jesus', 'PI'],
            ],
        }
        mountCombobox()
        await type('bom jesus')
        await press('Enter')
        const chosen = wrapper!.emitted('select')?.[0]?.[0] as { stateAbbreviation: string }
        expect(chosen.stateAbbreviation).toBe('PB')
        expect(wrapper!.get('input').element.value).toBe('Bom Jesus/PB')
        vi.advanceTimersByTime(250)
        await settle()
        // O rótulo escolhido não vira nova busca.
        expect(fetch).toHaveBeenCalledTimes(1)
        expect(options()).toHaveLength(0)
    })

    it('closes the list with Esc', async () => {
        answers['sao'] = { items: [['São Paulo', 'SP']] }
        mountCombobox()
        await type('sao')
        expect(options()).toHaveLength(1)
        await press('Escape')
        expect(options()).toHaveLength(0)
    })

    it('says when no municipality matches', async () => {
        answers['xyz'] = { items: [] }
        mountCombobox()
        await type('xyz')
        expect(listText()).toContain(
            'Nenhum município encontrado para "xyz". Confira a grafia ou digite só o começo do nome.',
        )
    })

    it('shows a loading line while the suggestions load', async () => {
        mountCombobox()
        await type('sao')
        expect(listText()).toContain('Buscando municípios')
    })

    it('offers to try again when the suggestions fail, keeping the text', async () => {
        answers['sao'] = { status: 500 }
        mountCombobox()
        await type('sao')
        expect(listText()).toContain('Não foi possível carregar os dados.')

        answers['sao'] = { items: [['São Paulo', 'SP']] }
        const retry = [...document.body.querySelectorAll('button')].find(
            (button) => button.textContent?.trim() === 'Tentar de novo',
        )
        retry?.click()
        await settle()
        expect(wrapper!.get('input').element.value).toBe('sao')
        expect(options().map((option) => option.textContent?.trim())).toEqual(['São Paulo/SP'])
    })

    it('does not search nor warn above 60 characters', async () => {
        mountCombobox()
        await type('a'.repeat(61))
        expect(fetch).not.toHaveBeenCalled()
        expect(listText()).not.toContain('Não foi possível')
    })

    it('is disabled with an explanation while the browser is verified', async () => {
        mountCombobox()
        setVerificationStateForTests('verifying')
        await settle()
        const input = wrapper!.get('input')
        expect(input.attributes('aria-disabled')).toBe('true')
        const explanation = wrapper!.get(`#${input.attributes('aria-describedby')}`)
        expect(explanation.text()).toContain('verificação')

        setVerificationStateForTests('verified')
        await settle()
        expect(wrapper!.get('input').attributes('aria-disabled')).toBeUndefined()
    })

    it('is disabled with an explanation while queries are blocked', async () => {
        mountCombobox()
        markRateLimited(30)
        await settle()
        const input = wrapper!.get('input')
        expect(input.attributes('aria-disabled')).toBe('true')
        const explanation = wrapper!.get(`#${input.attributes('aria-describedby')}`)
        expect(explanation.text()).toContain('Aguarde')
    })
})
