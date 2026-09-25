<script setup lang="ts">
import type { MunicipalitySuggestion } from '@censo/contracts'
import { nextTick, ref, useTemplateRef } from 'vue'
import { setDocumentTitle } from '@/shared/lib/document-title'
import { useSelectedMunicipality } from '../model/use-selected-municipality'
import MunicipalityCombobox from './MunicipalityCombobox.vue'

// Tela "Busca de cidades" (spec 001; design.md). Os indicadores entram na US2.

const EXAMPLES = ['Campinas', 'Bom Jesus', 'Paulo Afonso']

const { municipalityCode, selectMunicipality } = useSelectedMunicipality()
const searchText = ref('')
const combobox = useTemplateRef<InstanceType<typeof MunicipalityCombobox>>('combobox')

setDocumentTitle()

function onSelect(municipality: MunicipalitySuggestion): void {
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
            <p v-if="!municipalityCode" class="mt-3 max-w-[70ch] text-base text-ink-muted">
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
    </section>
</template>
