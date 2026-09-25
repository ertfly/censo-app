<script setup lang="ts">
import type { MunicipalitySuggestion } from '@censo/contracts'
import { ComboboxInput } from 'reka-ui'
import { computed, ref, useId, watch } from 'vue'
import { blockedQueryExplanation, queryBlockReason } from '@/shared/api'
import {
    Combobox,
    ComboboxAnchor,
    ComboboxItem,
    ComboboxList,
    ComboboxViewport,
} from '@/shared/ui/combobox'
import { useMunicipalitySuggestions } from '../api/suggestions'
import { matchParts } from '../lib/match-parts'

// Campo "Município" com sugestões "Nome/SIGLA" (spec 001 FR-001 a FR-008,
// FR-022, FR-023; design.md, "Estados").

const text = defineModel<string>({ default: '' })
const emit = defineEmits<{ select: [municipality: MunicipalitySuggestion] }>()

const inputId = useId()
const explanationId = useId()

const selected = ref<MunicipalitySuggestion | null>(null)

// O rótulo do município escolhido ("São Paulo/SP") não é um termo de busca.
const searchText = computed(() =>
    selected.value && text.value === label(selected.value) ? '' : text.value,
)
const { term, status, items, retry } = useMunicipalitySuggestions(searchText)
const open = ref(false)
const highlighted = ref<MunicipalitySuggestion | null>(null)

const blockReason = queryBlockReason
const explanation = computed(() =>
    blockReason.value ? blockedQueryExplanation(blockReason.value) : '',
)

function label(municipality: MunicipalitySuggestion): string {
    return `${municipality.name}/${municipality.stateAbbreviation}`
}

// A lista abre sempre que há termo buscável: sugestões, carregamento, falha ou
// nenhum resultado.
watch(term, (value) => {
    open.value = value !== null && blockReason.value === null
})

const announcement = computed(() => {
    if (status.value !== 'success') {
        return ''
    }
    const count = items.value.length
    if (count === 0) {
        return 'Nenhum município encontrado.'
    }
    return count === 1 ? '1 município encontrado.' : `${count} municípios encontrados.`
})

function choose(municipality: MunicipalitySuggestion | null | undefined): void {
    if (!municipality) {
        return
    }
    selected.value = municipality
    text.value = label(municipality)
    open.value = false
    emit('select', municipality)
}

function onHighlight(payload: { value: unknown } | undefined): void {
    highlighted.value = (payload?.value as MunicipalitySuggestion | undefined) ?? null
}

// Enter sem sugestão destacada escolhe a primeira.
function onEnter(event: KeyboardEvent): void {
    if (open.value && !highlighted.value && items.value.length > 0) {
        event.preventDefault()
        choose(items.value[0])
    }
}

function onRetry(): void {
    retry()
}

// Coloca o cursor no campo (exemplos do estado vazio).
function focus(): void {
    document.getElementById(inputId)?.focus()
}

defineExpose({ focus })
</script>

<template>
    <div class="flex flex-col gap-2">
        <label :for="inputId" class="text-sm font-medium text-ink">Município</label>
        <Combobox
            v-model="selected"
            v-model:open="open"
            :ignore-filter="true"
            :reset-search-term-on-blur="false"
            :reset-search-term-on-select="false"
            by="code"
            @update:model-value="(value) => choose(value as MunicipalitySuggestion | null)"
            @highlight="onHighlight"
        >
            <ComboboxAnchor class="w-full">
                <ComboboxInput
                    :id="inputId"
                    v-model="text"
                    :display-value="() => text"
                    :aria-disabled="blockReason ? 'true' : undefined"
                    :aria-describedby="blockReason ? explanationId : undefined"
                    :readonly="blockReason !== null"
                    autocomplete="off"
                    spellcheck="false"
                    maxlength="120"
                    class="h-12 w-full rounded-sm border border-input bg-sheet px-4 text-lg text-ink placeholder:text-ink-muted aria-disabled:cursor-not-allowed aria-disabled:text-ink-muted"
                    @keydown.enter="onEnter"
                />
            </ComboboxAnchor>
            <ComboboxList
                align="start"
                class="w-(--reka-combobox-trigger-width) rounded-sm border border-border bg-sheet p-1 data-[state=open]:animate-none"
            >
                <ComboboxViewport class="max-h-[26rem]">
                    <ComboboxItem
                        v-for="municipality in items"
                        :key="municipality.code"
                        :value="municipality"
                        class="rounded-xs px-3 py-2 text-base text-ink data-[highlighted]:bg-accent"
                    >
                        <span
                            ><template
                                v-for="(part, index) in matchParts(municipality.name, term ?? '')"
                                :key="index"
                                ><b v-if="part.matched" class="font-semibold">{{ part.text }}</b
                                ><template v-else>{{ part.text }}</template></template
                            ><span class="text-ink-muted"
                                >/{{ municipality.stateAbbreviation }}</span
                            ></span
                        >
                    </ComboboxItem>
                    <p v-if="status === 'loading'" class="px-3 py-2 text-base text-ink-muted">
                        Buscando municípios
                    </p>
                    <div
                        v-else-if="status === 'error'"
                        class="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-base text-ink"
                    >
                        <p>Não foi possível carregar os dados.</p>
                        <button
                            type="button"
                            class="font-medium text-marker underline underline-offset-2"
                            @click="onRetry"
                        >
                            Tentar de novo
                        </button>
                    </div>
                    <p
                        v-else-if="status === 'success' && items.length === 0"
                        class="max-w-[60ch] px-3 py-2 text-base text-ink"
                    >
                        Nenhum município encontrado para "{{ term }}". Confira a grafia ou digite só
                        o começo do nome.
                    </p>
                </ComboboxViewport>
            </ComboboxList>
        </Combobox>
        <p :id="explanationId" class="sr-only">{{ explanation }}</p>
        <p aria-live="polite" class="sr-only">{{ announcement }}</p>
    </div>
</template>
