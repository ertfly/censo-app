<script setup lang="ts">
import type { StateRanking } from '@censo/contracts'
import { computed, toRef, useId } from 'vue'
import { blockedQueryExplanation, queryBlockReason } from '@/shared/api'
import { formatDecimal2, formatDensity, formatInteger } from '@/shared/lib/format'
import { DensityScale } from '@/shared/ui/density-scale'
import { useRankingFilter } from '../model/use-ranking-filter'

// Ranking dos municípios por densidade (spec 002 FR-005, FR-006, FR-010,
// FR-015, FR-019 a FR-023; design.md). Linhas só para leitura.

const props = defineProps<{ ranking: StateRanking }>()

const filterId = useId()
const explanationId = useId()

const items = computed(() => props.ranking.items)
const stateCode = computed(() => props.ranking.state.code)
const { term, visibleItems, countLabel, hasNoMatch } = useRankingFilter(items, stateCode)

const stateDensity = toRef(() => props.ranking.totals.populationDensity)
const explanation = computed(() =>
    queryBlockReason.value ? blockedQueryExplanation(queryBlockReason.value) : '',
)
</script>

<template>
    <section aria-labelledby="ranking-title">
        <h3 id="ranking-title" class="sr-only">Municípios por densidade</h3>
        <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div class="flex w-full flex-col gap-2 sm:w-80">
                <label :for="filterId" class="text-sm font-medium text-ink">
                    Filtrar municípios
                </label>
                <input
                    :id="filterId"
                    v-model="term"
                    type="text"
                    autocomplete="off"
                    spellcheck="false"
                    :readonly="queryBlockReason !== null"
                    :aria-disabled="queryBlockReason ? 'true' : undefined"
                    :aria-describedby="queryBlockReason ? explanationId : undefined"
                    class="h-11 w-full rounded-sm border border-input bg-sheet px-3 text-base text-ink aria-disabled:cursor-not-allowed aria-disabled:text-ink-muted"
                />
                <p :id="explanationId" class="sr-only">{{ explanation }}</p>
            </div>
            <p aria-live="polite" class="text-sm text-ink-muted tabular-nums">{{ countLabel }}</p>
        </div>

        <p class="mt-4 max-w-[70ch] text-sm text-ink-muted">
            Na escala, a linha vertical marca a densidade de {{ ranking.state.name }} ({{
                formatDensity(stateDensity)
            }}).
        </p>

        <p v-if="hasNoMatch" class="mt-4 max-w-[70ch] text-base text-ink">
            Nenhum município de {{ ranking.state.name }} corresponde a "{{ term.trim() }}".
        </p>

        <div
            v-else
            class="mt-3 rounded-sm border border-border bg-sheet sm:max-h-[70vh] sm:overflow-y-auto"
        >
            <table data-ranking class="w-full border-collapse text-left">
                <thead class="max-sm:sr-only">
                    <tr class="text-sm text-ink">
                        <th
                            v-for="header in [
                                'Posição',
                                'Município',
                                'População',
                                'Área (km²)',
                                'Densidade (hab/km²)',
                                'Escala',
                            ]"
                            :key="header"
                            scope="col"
                            class="sticky top-0 z-[1] border-b border-border bg-sheet px-3 py-3 font-medium whitespace-nowrap"
                            :class="{
                                'text-right': !['Município', 'Escala'].includes(header),
                                'w-[22%]': header === 'Escala',
                            }"
                        >
                            {{ header }}
                        </th>
                    </tr>
                </thead>
                <tbody class="font-condensed tabular-nums">
                    <tr
                        v-for="item in visibleItems"
                        :key="item.code"
                        class="border-b border-border last:border-b-0 max-sm:grid max-sm:grid-cols-6 max-sm:gap-x-3 max-sm:gap-y-1 max-sm:px-4 max-sm:py-3"
                    >
                        <td
                            data-position
                            class="px-3 py-2 text-right text-ink-muted max-sm:col-span-1 max-sm:p-0 max-sm:text-left"
                        >
                            {{ formatInteger(item.position) }}
                        </td>
                        <th
                            scope="row"
                            class="px-3 py-2 font-sans font-medium text-ink max-sm:col-span-5 max-sm:p-0"
                        >
                            {{ item.name }}
                        </th>
                        <td
                            class="px-3 py-2 text-right text-ink max-sm:col-span-2 max-sm:p-0 max-sm:text-left"
                        >
                            <span
                                aria-hidden="true"
                                class="block font-sans text-xs text-ink-muted sm:hidden"
                                >População</span
                            >{{ formatInteger(item.population) }}
                        </td>
                        <td
                            class="px-3 py-2 text-right text-ink max-sm:col-span-2 max-sm:p-0 max-sm:text-left"
                        >
                            <span
                                aria-hidden="true"
                                class="block font-sans text-xs text-ink-muted sm:hidden"
                                >Área (km²)</span
                            >{{ formatDecimal2(item.areaKm2) }}
                        </td>
                        <td
                            :data-density="item.populationDensity"
                            class="px-3 py-2 text-right text-ink max-sm:col-span-2 max-sm:p-0 max-sm:text-left"
                        >
                            <span
                                aria-hidden="true"
                                class="block font-sans text-xs text-ink-muted sm:hidden"
                                >Densidade (hab/km²)</span
                            >{{ formatDecimal2(item.populationDensity) }}
                        </td>
                        <td class="px-3 py-2 max-sm:col-span-6 max-sm:p-0 max-sm:pt-1">
                            <DensityScale
                                compact
                                :value="item.populationDensity"
                                :reference="stateDensity"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>
