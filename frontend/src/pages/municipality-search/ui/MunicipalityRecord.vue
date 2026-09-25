<script setup lang="ts">
import type { MunicipalityIndicators } from '@censo/contracts'
import { computed, useTemplateRef } from 'vue'
import { formatDecimal2, formatInteger, formatPercent1 } from '@/shared/lib/format'
import { toPercentages } from '@/shared/lib/largest-remainder'
import { DensityScale } from '@/shared/ui/density-scale'
import { ProportionBar, type ProportionSegment } from '@/shared/ui/proportion-bar'

// Ficha do município (design.md, "Estrutura"): um bloco com divisões finas,
// rótulo pequeno acima e número grande em largura expandida.

const props = withDefaults(
    defineProps<{
        indicators: MunicipalityIndicators | null
        status: 'loading' | 'error' | 'success'
        // "Nome/SIGLA" já conhecido (da sugestão escolhida), para carregamento e erro.
        label?: string | null
    }>(),
    { label: null },
)
const emit = defineEmits<{ retry: [] }>()

const titleElement = useTemplateRef<HTMLHeadingElement>('title')

const AREA_TYPE_LABELS = {
    urban: 'Urbano',
    rural: 'Rural',
    unclassified: 'Sem classificação',
} as const

const title = computed(() =>
    props.indicators
        ? `${props.indicators.name}/${props.indicators.state.abbreviation}`
        : props.label,
)

const loaded = computed(() => (props.status === 'success' ? props.indicators : null))

function areaTypeSegments(field: 'censusTractCount' | 'population'): ProportionSegment[] {
    return (loaded.value?.areaTypeBreakdown ?? []).map((item) => ({
        key: item.areaType,
        label: AREA_TYPE_LABELS[item.areaType],
        value: item[field],
        tone: item.areaType === 'unclassified' ? 'no-data' : item.areaType,
    }))
}

const tractSegments = computed(() => areaTypeSegments('censusTractCount'))
const populationSegments = computed(() => areaTypeSegments('population'))

// Legenda única das duas barras: setores e pessoas por categoria.
const areaTypeLegend = computed(() => {
    const tractPercents = toPercentages(tractSegments.value.map((segment) => segment.value))
    const populationPercents = toPercentages(
        populationSegments.value.map((segment) => segment.value),
    )
    return tractSegments.value.map((segment, index) => ({
        key: segment.key,
        label: segment.label,
        tone: segment.tone,
        tracts: formatInteger(segment.value),
        tractsPercent: formatPercent1(tractPercents[index] ?? 0),
        population: formatInteger(populationSegments.value[index]?.value ?? 0),
        populationPercent: formatPercent1(populationPercents[index] ?? 0),
    }))
})

const sexSegments = computed<ProportionSegment[]>(() => {
    const sex = loaded.value?.sexBreakdown
    if (!sex) {
        return []
    }
    const segments: ProportionSegment[] = [
        { key: 'women', label: 'Mulheres', value: sex.women, tone: 'women' },
        { key: 'men', label: 'Homens', value: sex.men, tone: 'men' },
    ]
    if (sex.unknown > 0) {
        segments.push({
            key: 'unknown',
            label: 'Sem informação',
            value: sex.unknown,
            tone: 'no-data',
        })
    }
    return segments
})

const hasUnknownSex = computed(() => (loaded.value?.sexBreakdown.unknown ?? 0) > 0)

const TONE_CLASS: Partial<Record<ProportionSegment['tone'], string>> = {
    urban: 'bg-urban',
    rural: 'bg-rural',
    'no-data': 'bg-hatch',
}

// Foco programático no título, para leitores de tela anunciarem o resultado.
function focusTitle(): void {
    titleElement.value?.focus()
}

defineExpose({ focusTitle })
</script>

<template>
    <article aria-labelledby="municipality-record-title" :aria-busy="status === 'loading'">
        <h2
            v-if="title"
            id="municipality-record-title"
            ref="title"
            tabindex="-1"
            class="font-expanded text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] font-bold tracking-tight text-ink outline-none"
        >
            {{ title }}
        </h2>
        <div v-else aria-hidden="true" class="h-12 w-72 max-w-full rounded-xs bg-ink/10" />

        <div
            v-if="status === 'error'"
            role="alert"
            class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-sm border border-border bg-sheet px-5 py-4 text-ink"
        >
            <p>
                {{
                    title
                        ? `Não foi possível carregar os dados de ${title}.`
                        : 'Não foi possível carregar os dados.'
                }}
            </p>
            <button
                type="button"
                class="font-medium text-marker underline underline-offset-2"
                @click="emit('retry')"
            >
                Tentar de novo
            </button>
        </div>

        <div
            v-else
            class="mt-6 grid grid-cols-1 overflow-hidden rounded-sm border border-border bg-sheet sm:grid-cols-6"
        >
            <!-- Totais -->
            <section class="border-b border-border p-5 sm:col-span-2 sm:border-r">
                <h3 class="text-sm font-medium text-ink">População</h3>
                <p
                    v-if="loaded"
                    data-indicator="population"
                    class="mt-2 font-expanded text-[2rem] leading-tight font-semibold text-ink"
                >
                    {{ formatInteger(loaded.population) }}
                </p>
                <div v-else class="mt-3 h-8 w-40 rounded-xs bg-ink/10" />
            </section>
            <section class="border-b border-border p-5 sm:col-span-2 sm:border-r">
                <h3 class="text-sm font-medium text-ink">Setores censitários</h3>
                <p
                    v-if="loaded"
                    data-indicator="census-tracts"
                    class="mt-2 font-expanded text-[2rem] leading-tight font-semibold text-ink"
                >
                    {{ formatInteger(loaded.censusTractCount) }}
                </p>
                <div v-else class="mt-3 h-8 w-28 rounded-xs bg-ink/10" />
            </section>
            <section class="border-b border-border p-5 sm:col-span-2">
                <h3 class="text-sm font-medium text-ink">Área</h3>
                <p
                    v-if="loaded"
                    data-indicator="area"
                    class="mt-2 font-expanded text-[2rem] leading-tight font-semibold text-ink"
                >
                    {{ formatDecimal2(loaded.areaKm2) }}
                    <span class="font-condensed text-base font-normal text-ink-muted">km²</span>
                </p>
                <div v-else class="mt-3 h-8 w-36 rounded-xs bg-ink/10" />
            </section>

            <!-- Densidade -->
            <section class="border-b border-border p-5 sm:col-span-6">
                <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h3 class="text-sm font-medium text-ink">Densidade demográfica</h3>
                    <p
                        v-if="loaded"
                        data-indicator="density"
                        class="font-expanded text-2xl font-semibold text-ink"
                    >
                        {{ formatDecimal2(loaded.populationDensity) }}
                        <span class="font-condensed text-base font-normal text-ink-muted"
                            >hab/km²</span
                        >
                    </p>
                    <div v-else class="h-7 w-40 rounded-xs bg-ink/10" />
                </div>
                <div class="mt-4">
                    <DensityScale v-if="loaded" :value="loaded.populationDensity" />
                    <div v-else class="h-14 rounded-xs bg-ink/5" />
                </div>
            </section>

            <!-- Urbano e rural -->
            <section
                data-breakdown-group="area-type"
                class="border-b border-border p-5 sm:col-span-3 sm:border-r sm:border-b-0"
            >
                <h3 class="text-sm font-medium text-ink">Urbano e rural</h3>
                <template v-if="loaded">
                    <div class="mt-4 flex flex-col gap-2">
                        <ProportionBar
                            data-breakdown="area-type-tracts"
                            name="Setores"
                            :unit="['setor', 'setores']"
                            :segments="tractSegments"
                        />
                        <ProportionBar
                            data-breakdown="area-type-population"
                            name="População"
                            :unit="['pessoa', 'pessoas']"
                            :segments="populationSegments"
                        />
                    </div>
                    <table aria-hidden="true" class="mt-4 w-full text-sm">
                        <thead>
                            <tr class="text-ink-muted">
                                <th class="pb-1 text-left font-normal"></th>
                                <th colspan="2" class="pb-1 text-right font-normal">Setores</th>
                                <th colspan="2" class="pb-1 text-right font-normal">População</th>
                            </tr>
                        </thead>
                        <tbody class="tabular-nums">
                            <tr v-for="row in areaTypeLegend" :key="row.key">
                                <td class="py-0.5">
                                    <span class="flex items-center gap-2 text-ink">
                                        <span
                                            class="size-3 shrink-0"
                                            :class="TONE_CLASS[row.tone]"
                                        />
                                        {{ row.label }}
                                    </span>
                                </td>
                                <td class="py-0.5 pl-2 text-right font-condensed text-ink">
                                    {{ row.tracts }}
                                </td>
                                <td class="py-0.5 pl-2 text-right font-condensed text-ink-muted">
                                    {{ row.tractsPercent }}
                                </td>
                                <td class="py-0.5 pl-3 text-right font-condensed text-ink">
                                    {{ row.population }}
                                </td>
                                <td class="py-0.5 pl-2 text-right font-condensed text-ink-muted">
                                    {{ row.populationPercent }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </template>
                <div v-else class="mt-4 flex flex-col gap-3">
                    <div class="h-3 rounded-xs bg-ink/10" />
                    <div class="h-3 rounded-xs bg-ink/10" />
                </div>
            </section>

            <!-- Sexo -->
            <section class="p-5 sm:col-span-3">
                <h3 class="text-sm font-medium text-ink">Sexo</h3>
                <template v-if="loaded">
                    <ProportionBar
                        data-breakdown="sex"
                        class="mt-4"
                        :unit="['pessoa', 'pessoas']"
                        :segments="sexSegments"
                        legend
                    />
                    <p v-if="hasUnknownSex" class="mt-3 max-w-[60ch] text-sm text-ink-muted">
                        Parte da população não tem informação de sexo na base do Censo.
                    </p>
                </template>
                <div v-else class="mt-4 h-3 rounded-xs bg-ink/10" />
            </section>
        </div>
    </article>
</template>
