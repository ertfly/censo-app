import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from '@/app/router'
import { AppHeader } from '@/widgets/app-header'

async function renderAt(path: string) {
    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push(path)
    await router.isReady()
    return mount(AppHeader, { global: { plugins: [router] } })
}

function currentLabels(wrapper: Awaited<ReturnType<typeof renderAt>>): string[] {
    return wrapper.findAll('[aria-current="page"]').map((link) => link.text())
}

describe('AppHeader', () => {
    it('shows the app name and both screens', async () => {
        const wrapper = await renderAt('/municipalities')
        expect(wrapper.text()).toContain('Censo 2022')
        expect(wrapper.findAll('nav a').map((link) => link.text())).toEqual([
            'Busca de cidades',
            'Busca por estado',
        ])
    })

    it.each([
        ['/municipalities', 'Busca de cidades'],
        ['/municipalities/3550308', 'Busca de cidades'],
        ['/states', 'Busca por estado'],
        ['/states/31', 'Busca por estado'],
    ])('marks the current screen at %s', async (path, label) => {
        expect(currentLabels(await renderAt(path))).toEqual([label])
    })

    it('opens the city search from the main address', async () => {
        expect(currentLabels(await renderAt('/'))).toEqual(['Busca de cidades'])
    })
})
