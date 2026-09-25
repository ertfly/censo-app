<script setup lang="ts">
import type { MunicipalitySuggestion } from '@censo/contracts'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { errorMessage } from '@/shared/api'
import { setDocumentTitle } from '@/shared/lib/document-title'
import { useMunicipalityIndicators } from '../api/indicators'
import { useSelectedMunicipality } from '../model/use-selected-municipality'
import MunicipalityCombobox from './MunicipalityCombobox.vue'
import MunicipalityRecord from './MunicipalityRecord.vue'

// Tela "Busca de cidades" (spec 001; design.md): campo único e, abaixo, a ficha
// do município cujo código está na URL.

const EXAMPLES = ['Campinas', 'Bom Jesus', 'Paulo Afonso']

const { municipalityCode, selectMunicipality } = useSelectedMunicipality()
const { status, indicators, error, retry } = useMunicipalityIndicators(municipalityCode)

const searchText = ref('')
const chosen = ref<MunicipalitySuggestion | null>(null)
const combobox = useTemplateRef<InstanceType<typeof MunicipalityCombobox>>('combobox')
const record = useTemplateRef<InstanceType<typeof MunicipalityRecord>>('record')

// Nome já conhecido pela sugestão escolhida, exibido enquanto a ficha carrega.
const chosenLabel = computed(() =>
    chosen.value && chosen.value.code === municipalityCode.value
        ? `${chosen.value.name}/${chosen.value.stateAbbreviation}`
        : null,
)

const recordStatus = computed(() => {
    const value = status.value
    return value === 'success' || value === 'error' || value === 'loading' ? value : null
})

const showExamples = computed(() => status.value === 'idle' || status.value === 'invalid-address')

watch(
    [status, indicators],
    async ([current, loaded]) => {
        if (current === 'success' && loaded) {
            setDocumentTitle(`${loaded.name}/${loaded.state.abbreviation}`)
            await nextTick()
            record.value?.focusTitle()
        } else if (current === 'idle' || current === 'invalid-address') {
            setDocumentTitle()
        }
    },
    { immediate: true },
)

// Endereço inválido: a busca volta vazia (FR-018).
watch(status, (current) => {
    if (current === 'invalid-address') {
        searchText.value = ''
    }
})

function onSelect(municipality: MunicipalitySuggestion): void {
    chosen.value = municipality
    selectMunicipality(municipality.code)
}

// Os exemplos preenchem a busca e deixam o cursor no campo, com a lista aberta.
async function useExample(name: string): Promise<void> {
    searchText.value = name
    await nextTick()
    combobox.value?.focus()
}
</script>

<template>
    <section aria-labelledby="municipality-search-title" class="grid grid-cols-12 gap-x-6">
        <h1 id="municipality-search-title" class="sr-only">Busca de cidades</h1>
        <div class="col-span-12 lg:col-span-8">
            <MunicipalityCombobox ref="combobox" v-model="searchText" @select="onSelect" />
            <p
                v-if="status === 'invalid-address'"
                role="alert"
                class="mt-3 border-l-4 border-marker bg-sheet px-4 py-3 text-ink"
            >
                {{ errorMessage(error) }}
            </p>
            <p v-if="showExamples" class="mt-3 max-w-[70ch] text-base text-ink-muted">
                Digite o nome de um município. Ex.:
                <template v-for="(example, index) in EXAMPLES" :key="example"
                    ><button
                        type="button"
                        class="text-marker underline underline-offset-2"
                        @click="useExample(example)"
                    >
                        {{ example }}</button
                    >{{ index < EXAMPLES.length - 1 ? ', ' : '.' }}</template
                >
            </p>
        </div>
        <div v-if="recordStatus" class="col-span-12 mt-10">
            <MunicipalityRecord
                ref="record"
                :indicators="indicators"
                :status="recordStatus"
                :label="chosenLabel"
                @retry="retry"
            />
        </div>
    </section>
</template>
