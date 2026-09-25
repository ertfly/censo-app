import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// UF escolhida, guardada na URL `/states/:stateCode` (spec 002 FR-017). Cada
// escolha substitui o endereço no histórico, como na 001 (FR-028). A validade
// do código é decidida pela API (INVALID_STATE_CODE, FR-018).
export function useSelectedState() {
    const route = useRoute()
    const router = useRouter()

    const stateCode = computed(() => {
        const value = route.params['stateCode']
        return typeof value === 'string' && value !== '' ? value : null
    })

    function selectState(code: string): void {
        void router.replace({ name: 'state-ranking', params: { stateCode: code } })
    }

    return { stateCode, selectState }
}
