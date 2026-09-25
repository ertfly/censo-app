<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const links = [
    { to: '/municipalities', label: 'Busca de cidades' },
    { to: '/states', label: 'Busca por estado' },
] as const

// A tela atual inclui as subrotas (ex.: /municipalities/3550308).
const currentPath = computed(() => route.path)
function isCurrent(to: string): boolean {
    return currentPath.value === to || currentPath.value.startsWith(`${to}/`)
}
</script>

<template>
    <header class="sticky top-0 z-10 border-b border-border bg-paper">
        <div
            class="mx-auto flex max-w-[72rem] flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6"
        >
            <span class="font-expanded text-lg font-bold tracking-tight text-ink">Censo 2022</span>
            <nav aria-label="Telas" class="flex gap-6">
                <RouterLink
                    v-for="link in links"
                    :key="link.to"
                    :to="link.to"
                    :aria-current="isCurrent(link.to) ? 'page' : undefined"
                    class="border-b-2 py-1 text-sm font-medium no-underline transition-colors"
                    :class="
                        isCurrent(link.to)
                            ? 'border-marker text-ink'
                            : 'border-transparent text-ink-muted hover:text-ink'
                    "
                >
                    {{ link.label }}
                </RouterLink>
            </nav>
            <div class="ml-auto text-sm text-ink-muted">
                <slot name="status" />
            </div>
        </div>
    </header>
</template>
