<script setup lang="ts">
import { RouterView } from 'vue-router'
import { AppHeader, ProtectionNotice } from '@/widgets/app-header'
</script>

<template>
    <div class="flex min-h-dvh flex-col">
        <AppHeader />
        <main class="mx-auto w-full max-w-[72rem] flex-1 px-4 py-8 sm:px-6">
            <ProtectionNotice class="mb-6" />
            <RouterView />
        </main>
        <footer class="mx-auto w-full max-w-[72rem] px-4 pb-6 text-sm text-ink-muted sm:px-6">
            Fonte: IBGE, Censo Demográfico 2022
        </footer>
    </div>
</template>
