<script setup lang="ts">
import type { StateRanking } from '@censo/contracts'
import { computed, useTemplateRef } from 'vue'
import { formatDecimal2, formatInteger, formatKm2 } from '@/shared/lib/format'
import { DensityScale } from '@/shared/ui/density-scale'

// Ficha da UF (spec 002 FR-008, FR-009; design.md): mesmo padrão da ficha do
// município, com a nota da área fora dos municípios quando houver.

const props = withDefaults(
    defineProps<{
        ranking: StateRanking | null
        // "Nome/SIGLA" já conhecido pela lista de UFs, para o carregamento.
        label?: string | null
    }>(),
    { label: null },
)

const titleElement = useTemplateRef<HTMLHeadingElement>('title')

const title = computed(() =>
    props.ranking ? `${props.ranking.state.name}/${props.ranking.state.abbreviation}` : props.label,
)
const totals = computed(() => props.ranking?.totals ?? null)

function focusTitle(): void {
    titleElement.value?.focus()
}

defineExpose({ focusTitle })
</script>

<template>
    <article aria-labelledby="state-record-title" :aria-busy="!ranking">
        <h2
            v-if="title"
            id="state-record-title"
            ref="title"
            tabindex="-1"
            class="font-expanded text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] font-bold tracking-tight text-ink outline-none"
        >
            {{ title }}
        </h2>
        <div v-else aria-hidden="true" class="h-12 w-72 max-w-full rounded-xs bg-ink/10" />

        <div
            class="mt-6 grid grid-cols-1 overflow-hidden rounded-sm border border-border bg-sheet sm:grid-cols-3"
        >
            <section class="border-b border-border p-5 sm:border-r">
                <h3 class="text-sm font-medium text-ink">População</h3>
                <p
                    v-if="totals"
                    data-indicator="population"
                    class="mt-2 font-expanded text-[2rem] leading-tight font-semibold text-ink"
                >
                    {{ formatInteger(totals.population) }}
                </p>
                <div v-else class="mt-3 h-8 w-40 rounded-xs bg-ink/10" />
            </section>
            <section class="border-b border-border p-5 sm:border-r">
                <h3 class="text-sm font-medium text-ink">Área</h3>
                <template v-if="totals">
                    <p
                        data-indicator="area"
                        class="mt-2 font-expanded text-[2rem] leading-tight font-semibold text-ink"
                    >
                        {{ formatDecimal2(totals.areaKm2) }}
                        <span class="font-condensed text-base font-normal text-ink-muted">km²</span>
                    </p>
                    <p
                        v-if="totals.areaOutsideMunicipalitiesKm2 > 0"
                        class="mt-2 max-w-[40ch] text-sm text-ink-muted"
                    >
                        Inclui {{ formatKm2(totals.areaOutsideMunicipalitiesKm2) }} fora dos
                        municípios, registrados sem município na base do Censo.
                    </p>
                </template>
                <div v-else class="mt-3 h-8 w-44 rounded-xs bg-ink/10" />
            </section>
            <section class="border-b border-border p-5">
                <h3 class="text-sm font-medium text-ink">Densidade demográfica</h3>
                <p
                    v-if="totals"
                    data-indicator="density"
                    class="mt-2 font-expanded text-[2rem] leading-tight font-semibold text-ink"
                >
                    {{ formatDecimal2(totals.populationDensity) }}
                    <span class="font-condensed text-base font-normal text-ink-muted">hab/km²</span>
                </p>
                <div v-else class="mt-3 h-8 w-36 rounded-xs bg-ink/10" />
            </section>
            <div class="p-5 sm:col-span-3">
                <DensityScale v-if="totals" :value="totals.populationDensity" />
                <div v-else class="h-14 rounded-xs bg-ink/5" />
            </div>
        </div>
    </article>
</template>
