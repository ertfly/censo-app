import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Município escolhido, guardado na URL `/municipalities/:municipalityCode`
// (spec 001 FR-017). Cada escolha substitui o endereço no histórico: o botão
// voltar leva à página visitada antes da busca (FR-025).
export function useSelectedMunicipality() {
    const route = useRoute()
    const router = useRouter()

    const municipalityCode = computed(() => {
        const value = route.params['municipalityCode']
        return typeof value === 'string' && value !== '' ? value : null
    })

    function selectMunicipality(code: string): void {
        void router.replace({ name: 'municipality-search', params: { municipalityCode: code } })
    }

    return { municipalityCode, selectMunicipality }
}
