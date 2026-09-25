import type { StateSummary } from '@censo/contracts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import StateSelect from '@/pages/state-ranking/ui/StateSelect.vue'
import {
    markRateLimited,
    resetSessionForTests,
    setVerificationStateForTests,
} from '@/shared/api/session'

const STATES: StateSummary[] = [
    ['12', 'AC', 'Acre'],
    ['27', 'AL', 'Alagoas'],
    ['16', 'AP', 'Amapá'],
    ['13', 'AM', 'Amazonas'],
    ['29', 'BA', 'Bahia'],
    ['23', 'CE', 'Ceará'],
    ['53', 'DF', 'Distrito Federal'],
    ['32', 'ES', 'Espírito Santo'],
    ['52', 'GO', 'Goiás'],
    ['21', 'MA', 'Maranhão'],
    ['51', 'MT', 'Mato Grosso'],
    ['50', 'MS', 'Mato Grosso do Sul'],
    ['31', 'MG', 'Minas Gerais'],
    ['15', 'PA', 'Pará'],
    ['25', 'PB', 'Paraíba'],
    ['41', 'PR', 'Paraná'],
    ['26', 'PE', 'Pernambuco'],
    ['22', 'PI', 'Piauí'],
    ['33', 'RJ', 'Rio de Janeiro'],
    ['24', 'RN', 'Rio Grande do Norte'],
    ['43', 'RS', 'Rio Grande do Sul'],
    ['11', 'RO', 'Rondônia'],
    ['14', 'RR', 'Roraima'],
    ['42', 'SC', 'Santa Catarina'],
    ['35', 'SP', 'São Paulo'],
    ['28', 'SE', 'Sergipe'],
    ['17', 'TO', 'Tocantins'],
].map(([code, abbreviation, name]) => ({ code: code!, abbreviation: abbreviation!, name: name! }))

let wrapper: VueWrapper | null = null

async function settle(): Promise<void> {
    for (let index = 0; index < 5; index += 1) {
        await nextTick()
    }
}

function mountSelect(modelValue: string | null = null) {
    wrapper = mount(StateSelect, {
        props: { states: STATES, modelValue },
        attachTo: document.body,
    })
    return wrapper
}

function trigger() {
    return wrapper!.get('[role="combobox"]')
}

async function openWithKeyboard(): Promise<void> {
    await trigger().trigger('keydown', { key: 'Enter' })
    await settle()
}

function options(): string[] {
    return [...document.body.querySelectorAll('[role="option"]')].map(
        (option) => option.textContent?.trim() ?? '',
    )
}

beforeEach(() => {
    resetSessionForTests()
})

afterEach(() => {
    wrapper?.unmount()
    wrapper = null
})

describe('StateSelect', () => {
    it('has the "Unidade federativa" label', () => {
        mountSelect()
        const id = trigger().attributes('id')
        expect(wrapper!.get(`label[for="${id}"]`).text()).toBe('Unidade federativa')
    })

    it('lists the 27 states as "Nome/SIGLA" in the order received', async () => {
        mountSelect()
        await openWithKeyboard()
        expect(options()).toHaveLength(27)
        expect(options()).toEqual(STATES.map((state) => `${state.name}/${state.abbreviation}`))
    })

    it('chooses a state with the keyboard, typing to search', async () => {
        mountSelect()
        await openWithKeyboard()
        const content = document.body.querySelector('[role="listbox"]')!
        for (const key of ['m', 'i', 'n']) {
            content.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
            await settle()
        }
        const highlighted = document.body.querySelector('[role="option"][data-highlighted]')
        expect(highlighted?.textContent?.trim()).toBe('Minas Gerais/MG')
        highlighted!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        await settle()
        expect(wrapper!.emitted('update:modelValue')?.at(-1)).toEqual(['31'])
    })

    it('shows the chosen state', () => {
        mountSelect('31')
        expect(trigger().text()).toContain('Minas Gerais/MG')
    })

    it('is disabled with an explanation while the browser is verified', async () => {
        mountSelect()
        setVerificationStateForTests('verifying')
        await settle()
        expect(trigger().attributes('aria-disabled')).toBe('true')
        const explanation = wrapper!.get(`#${trigger().attributes('aria-describedby')}`)
        expect(explanation.text()).toContain('verificação')
    })

    it('is disabled with an explanation while queries are blocked', async () => {
        mountSelect()
        markRateLimited(30)
        await settle()
        expect(trigger().attributes('aria-disabled')).toBe('true')
        const explanation = wrapper!.get(`#${trigger().attributes('aria-describedby')}`)
        expect(explanation.text()).toContain('Aguarde')
    })
})
