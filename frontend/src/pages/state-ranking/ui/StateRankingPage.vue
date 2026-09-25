<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import { errorMessage } from '@/shared/api'
import { setDocumentTitle } from '@/shared/lib/document-title'
import { useStateDensityRanking } from '../api/density-ranking'
import { useStates } from '../api/states'
import { useSelectedState } from '../model/use-selected-state'
import RankingTable from './RankingTable.vue'
import StateSelect from './StateSelect.vue'

// Tela "Busca por estado" (spec 002; design.md): seleção de UF e, abaixo, o
// ranking dos municípios por densidade.

const { stateCode, selectState } = useSelectedState()
const { states } = useStates()
const { status, ranking, error, retry } = useStateDensityRanking(stateCode)

const titleElement = useTemplateRef<HTMLHeadingElement>('title')

// "Nome/SIGLA" da UF escolhida, conhecido pela lista antes do ranking chegar.
const stateLabel = computed(() => {
    const state = ranking.value?.state ?? states.value.find((item) => item.code === stateCode.value)
    return state ? `${state.name}/${state.abbreviation}` : null
})

const selectedCode = computed({
    get: () => (status.value === 'invalid-address' ? null : stateCode.value),
    set: (code) => {
        if (code) {
            selectState(code)
        }
    },
})

watch(
    [status, ranking],
    async ([current, loaded]) => {
        if (current === 'success' && loaded) {
            setDocumentTitle(`${loaded.state.name}/${loaded.state.abbreviation}`)
            await nextTick()
            titleElement.value?.focus()
        } else if (current === 'idle' || current === 'invalid-address') {
            setDocumentTitle()
        }
    },
    { immediate: true },
)
</script>

<template>
    <section aria-labelledby="state-ranking-title">
        <h1 id="state-ranking-title" class="sr-only">Busca por estado</h1>
        <StateSelect v-model="selectedCode" :states="states" />
        <p
            v-if="status === 'invalid-address'"
            role="alert"
            class="mt-3 max-w-[70ch] border-l-4 border-marker bg-sheet px-4 py-3 text-ink"
        >
            {{ errorMessage(error) }}
        </p>
        <p
            v-if="status === 'idle' || status === 'invalid-address'"
            class="mt-3 max-w-[70ch] text-base text-ink-muted"
        >
            Escolha uma unidade federativa para ver seus municípios ordenados por densidade.
        </p>

        <div
            v-if="status === 'loading' || status === 'error' || status === 'success'"
            class="mt-10"
        >
            <h2
                v-if="stateLabel"
                ref="title"
                tabindex="-1"
                class="font-expanded text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] font-bold tracking-tight text-ink outline-none"
            >
                {{ stateLabel }}
            </h2>
            <div v-else aria-hidden="true" class="h-12 w-72 max-w-full rounded-xs bg-ink/10" />

            <div
                v-if="status === 'error'"
                role="alert"
                class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-sm border border-border bg-sheet px-5 py-4 text-ink"
            >
                <p>
                    {{
                        stateLabel
                            ? `Não foi possível carregar os dados de ${stateLabel}.`
                            : 'Não foi possível carregar os dados.'
                    }}
                </p>
                <button
                    type="button"
                    class="font-medium text-marker underline underline-offset-2"
                    @click="retry"
                >
                    Tentar de novo
                </button>
            </div>

            <div v-else-if="status === 'loading'" aria-busy="true" class="mt-8">
                <p class="text-sm font-medium text-ink">Filtrar municípios</p>
                <div class="mt-2 h-11 w-full rounded-sm bg-ink/10 sm:w-80" />
                <div class="mt-6 rounded-sm border border-border bg-sheet p-3">
                    <div v-for="row in 10" :key="row" class="my-2 h-6 rounded-xs bg-ink/10" />
                </div>
            </div>

            <RankingTable
                v-else-if="ranking"
                :key="ranking.state.code"
                class="mt-8"
                :ranking="ranking"
            />
        </div>
    </section>
</template>
