import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { resetSessionForTests, setVerificationStateForTests } from '@/shared/api/session'
import ProtectionNotice from '@/widgets/app-header/ui/ProtectionNotice.vue'
import VerificationStatus from '@/widgets/app-header/ui/VerificationStatus.vue'

// O web component do ALTCHA não roda no jsdom; o componente o carrega sob demanda.
vi.mock('@/widgets/app-header/lib/load-altcha', () => ({
    loadAltcha: () => Promise.resolve(),
}))

beforeEach(() => {
    resetSessionForTests()
})

describe('VerificationStatus', () => {
    it('announces the verification politely and hides it afterwards', async () => {
        const wrapper = mount(VerificationStatus)
        setVerificationStateForTests('verifying')
        await nextTick()
        expect(wrapper.get('[aria-live="polite"]').text()).toContain('Verificando o navegador')

        setVerificationStateForTests('verified')
        await nextTick()
        expect(wrapper.get('[aria-live="polite"]').text()).toBe('')
    })

    it('says when the verification did not finish', async () => {
        const wrapper = mount(VerificationStatus)
        setVerificationStateForTests('failed')
        await nextTick()
        expect(wrapper.text()).toContain('Verificação não concluída')
    })
})

describe('ProtectionNotice', () => {
    it('offers to try again after a failure', async () => {
        const wrapper = mount(ProtectionNotice)
        setVerificationStateForTests('failed')
        await nextTick()
        const alert = wrapper.get('[role="alert"]')
        expect(alert.text()).toContain('A verificação automática não foi concluída.')
        expect(alert.find('button').text()).toBe('Tentar de novo')
    })

    it('explains an unsupported browser without a retry button', async () => {
        const wrapper = mount(ProtectionNotice)
        setVerificationStateForTests('unsupported')
        await nextTick()
        const alert = wrapper.get('[role="alert"]')
        expect(alert.text()).toContain(
            'Seu navegador não conseguiu fazer a verificação automática.',
        )
        expect(alert.find('button').exists()).toBe(false)
    })

    it('shows nothing while verified', async () => {
        const wrapper = mount(ProtectionNotice)
        setVerificationStateForTests('verified')
        await nextTick()
        expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
})
