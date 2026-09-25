<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { formatDensity } from '@/shared/lib/format'
import {
    DENSITY_MAX,
    DENSITY_MIN,
    DENSITY_TICKS,
    densityPosition,
    formatDensityTick,
} from './density-scale'

// Escala de densidade (design-system.md): o marcador desliza uma vez até a
// posição ao aparecer; com prefers-reduced-motion, a transição global é anulada.
// A variante compacta (linhas do ranking da 002) não tem rótulos nem movimento.

const props = withDefaults(
    defineProps<{
        value: number
        // Marca vertical de comparação (ex.: densidade da UF).
        reference?: number | null
        compact?: boolean
    }>(),
    { reference: null, compact: false },
)

const position = computed(() => densityPosition(props.value) * 100)
const referencePosition = computed(() =>
    props.reference === null ? null : densityPosition(props.reference) * 100,
)

// Começa na ponta esquerda e desliza no primeiro quadro após montar.
const placed = ref(props.compact)
onMounted(() => {
    if (!placed.value) {
        requestAnimationFrame(() => {
            placed.value = true
        })
    }
})

const markerLeft = computed(() => `${placed.value ? position.value : 0}%`)

// Em telas estreitas, só os rótulos 1, 100 e 10.000 (design.md, "celular").
const NARROW_HIDDEN = new Set<number>([10, 1000])

const description = computed(
    () =>
        `${formatDensity(props.value)}, na escala de ${formatDensityTick(DENSITY_MIN)} a ${formatDensityTick(DENSITY_MAX)} hab/km².`,
)
</script>

<template>
    <!-- Linha e marcas desenhadas no fundo: cada potência de dez ocupa 1/6 da
         régua, e o ranking da 002 tem até 853 réguas. -->
    <div
        v-if="compact"
        aria-hidden="true"
        class="compact-ruler relative h-4 w-full min-w-24"
        data-density-scale="compact"
    >
        <span
            v-if="referencePosition !== null"
            data-density-reference
            class="absolute inset-y-0 w-px bg-ink"
            :style="{ left: `${referencePosition}%` }"
        />
        <span
            class="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-marker"
            :style="{ left: `${position}%` }"
        />
    </div>

    <figure v-else class="w-full" data-density-scale>
        <figcaption class="sr-only">{{ description }}</figcaption>
        <div aria-hidden="true" class="relative mx-1 h-9">
            <!-- Régua -->
            <span class="absolute inset-x-0 bottom-2 h-px bg-ink/40" />
            <span
                v-for="tick in [DENSITY_MIN, ...DENSITY_TICKS, DENSITY_MAX]"
                :key="tick"
                class="absolute bottom-2 h-2.5 w-px bg-ink/40"
                :style="{ left: `${densityPosition(tick) * 100}%` }"
            />
            <span
                v-if="referencePosition !== null"
                data-density-reference
                class="absolute bottom-0 h-7 w-px bg-ink"
                :style="{ left: `${referencePosition}%` }"
            />
            <!-- Marcador -->
            <span
                data-density-marker
                class="absolute bottom-0 flex -translate-x-1/2 flex-col items-center transition-[left] duration-700 ease-out"
                :style="{ left: markerLeft }"
            >
                <span class="size-3 rounded-full bg-marker ring-2 ring-sheet" />
                <span class="h-5 w-0.5 bg-marker" />
            </span>
        </div>
        <div
            aria-hidden="true"
            class="relative mx-1 mt-1 h-5 font-condensed text-sm text-ink-muted tabular-nums"
        >
            <span class="absolute left-0 max-sm:hidden">{{ formatDensityTick(DENSITY_MIN) }}</span>
            <span
                v-for="tick in DENSITY_TICKS"
                :key="tick"
                class="absolute -translate-x-1/2"
                :class="{ 'max-sm:hidden': NARROW_HIDDEN.has(tick) }"
                :style="{ left: `${densityPosition(tick) * 100}%` }"
                >{{ formatDensityTick(tick) }}</span
            >
            <span class="absolute right-0 max-sm:hidden">{{ formatDensityTick(DENSITY_MAX) }}</span>
        </div>
    </figure>
</template>

<style scoped>
.compact-ruler {
    background-image:
        linear-gradient(rgb(18 49 58 / 0.3), rgb(18 49 58 / 0.3)),
        repeating-linear-gradient(
            to right,
            rgb(18 49 58 / 0.3) 0 1px,
            transparent 1px calc(100% / 6)
        );
    background-repeat: no-repeat;
    background-size:
        100% 1px,
        100% 6px;
    background-position:
        0 50%,
        0 50%;
}
</style>
