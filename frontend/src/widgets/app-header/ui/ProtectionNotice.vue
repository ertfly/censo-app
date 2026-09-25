<script setup lang="ts">
import { retryVerification, verificationState } from '@/shared/api'

// Aviso acima do conteúdo quando a proteção exige ação (specs/003-bot-protection/design.md).
function tryAgain(): void {
    retryVerification().catch(() => undefined)
}
</script>

<template>
    <div
        v-if="verificationState === 'failed' || verificationState === 'unsupported'"
        role="alert"
        class="flex flex-wrap items-center gap-x-4 gap-y-2 border-l-4 border-marker bg-sheet px-4 py-3 text-ink"
    >
        <p v-if="verificationState === 'failed'">A verificação automática não foi concluída.</p>
        <p v-else>
            Seu navegador não conseguiu fazer a verificação automática. Use um navegador atualizado
            com JavaScript ativado.
        </p>
        <button
            v-if="verificationState === 'failed'"
            type="button"
            class="font-medium text-marker underline underline-offset-2"
            @click="tryAgain"
        >
            Tentar de novo
        </button>
    </div>
</template>
