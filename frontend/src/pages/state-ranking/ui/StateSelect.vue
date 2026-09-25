<script setup lang="ts">
import type { StateSummary } from '@censo/contracts'
import { computed, useId } from 'vue'
import { blockedQueryExplanation, queryBlockReason } from '@/shared/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

// Seleção de UF (spec 002 FR-001, FR-026): opções "Nome/SIGLA" na ordem da API
// e busca por digitação do Select do Reka UI.

const props = defineProps<{ states: StateSummary[] }>()
const model = defineModel<string | null>({ default: null })

const triggerId = useId()
const explanationId = useId()

const explanation = computed(() =>
    queryBlockReason.value ? blockedQueryExplanation(queryBlockReason.value) : '',
)

function label(state: StateSummary): string {
    return `${state.name}/${state.abbreviation}`
}

const selectedLabel = computed(() => {
    const state = props.states.find((item) => item.code === model.value)
    return state ? label(state) : undefined
})

function onUpdate(value: unknown): void {
    if (typeof value === 'string') {
        model.value = value
    }
}
</script>

<template>
    <div class="flex flex-col gap-2">
        <label :for="triggerId" class="text-sm font-medium text-ink">Unidade federativa</label>
        <Select
            :model-value="model ?? undefined"
            :disabled="queryBlockReason !== null"
            @update:model-value="onUpdate"
        >
            <SelectTrigger
                :id="triggerId"
                :aria-disabled="queryBlockReason ? 'true' : undefined"
                :aria-describedby="queryBlockReason ? explanationId : undefined"
                class="h-12 w-full rounded-sm border-input bg-sheet px-4 text-lg text-ink data-[placeholder]:text-ink-muted disabled:opacity-100 aria-disabled:cursor-not-allowed aria-disabled:text-ink-muted sm:w-96"
            >
                <SelectValue placeholder="Escolha uma UF">{{ selectedLabel }}</SelectValue>
            </SelectTrigger>
            <SelectContent
                position="popper"
                class="max-h-[min(24rem,var(--reka-select-content-available-height))] rounded-sm border-border bg-sheet data-[state=open]:animate-none"
            >
                <SelectItem
                    v-for="state in states"
                    :key="state.code"
                    :value="state.code"
                    class="px-3 py-2 text-base text-ink focus:bg-accent data-[highlighted]:bg-accent"
                >
                    {{ label(state) }}
                </SelectItem>
            </SelectContent>
        </Select>
        <p :id="explanationId" class="sr-only">{{ explanation }}</p>
    </div>
</template>
