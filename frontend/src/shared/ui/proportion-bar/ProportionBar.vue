<script setup lang="ts">
import { computed } from 'vue'
import { formatInteger, formatPercent1 } from '@/shared/lib/format'
import { toPercentages } from '@/shared/lib/largest-remainder'

// Barra de proporção (design-system.md, "Forma"): segmentos coloridos lado a
// lado, hachura diagonal para "sem dado", texto equivalente para leitores de
// tela e legenda escrita opcional (a cor nunca é a única pista).

export type ProportionTone = 'urban' | 'rural' | 'women' | 'men' | 'no-data'

export interface ProportionSegment {
    key: string
    label: string
    value: number
    tone: ProportionTone
}

const props = withDefaults(
    defineProps<{
        segments: ProportionSegment[]
        // Unidade no texto para leitores de tela: ["setor", "setores"].
        unit: readonly [singular: string, plural: string]
        // Nome curto ao lado da barra (ex.: "Setores"), quando há mais de uma.
        name?: string
        legend?: boolean
    }>(),
    { name: undefined, legend: false },
)

const TONE_CLASS: Record<ProportionTone, string> = {
    urban: 'bg-urban',
    rural: 'bg-rural',
    women: 'bg-ink',
    men: 'bg-ink-muted',
    'no-data': 'bg-hatch',
}

const rows = computed(() => {
    const percentages = toPercentages(props.segments.map((segment) => segment.value))
    return props.segments.map((segment, index) => ({
        ...segment,
        percent: percentages[index] ?? 0,
        toneClass: TONE_CLASS[segment.tone],
    }))
})

function quantity(value: number): string {
    return `${formatInteger(value)} ${value === 1 ? props.unit[0] : props.unit[1]}`
}
</script>

<template>
    <div>
        <div class="flex items-center gap-3">
            <span v-if="name" aria-hidden="true" class="w-20 shrink-0 text-sm text-ink">{{
                name
            }}</span>
            <div aria-hidden="true" class="flex h-3 flex-1 overflow-hidden bg-ink/10">
                <span
                    v-for="row in rows"
                    v-show="row.percent > 0"
                    :key="row.key"
                    class="h-full"
                    :class="row.toneClass"
                    :style="{ width: `${row.percent}%` }"
                />
            </div>
        </div>
        <ul class="sr-only">
            <li v-for="row in rows" :key="row.key">
                {{ row.label }}: {{ quantity(row.value) }},
                <span data-percent>{{ formatPercent1(row.percent) }}</span>
            </li>
        </ul>
        <table v-if="legend" aria-hidden="true" class="mt-3 w-full text-sm">
            <tbody>
                <tr v-for="row in rows" :key="row.key">
                    <td class="py-0.5">
                        <span class="flex items-center gap-2 text-ink">
                            <span class="size-3 shrink-0" :class="row.toneClass" />
                            {{ row.label }}
                        </span>
                    </td>
                    <td class="py-0.5 text-right font-condensed text-ink tabular-nums">
                        {{ formatInteger(row.value) }}
                    </td>
                    <td class="w-16 py-0.5 text-right font-condensed text-ink-muted tabular-nums">
                        {{ formatPercent1(row.percent) }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
