<script setup lang="ts">
import {
    rateLimitHasEnded,
    rateLimitInitialSeconds,
    rateLimitRemainingSeconds,
    retryVerification,
    verificationState,
} from '@/shared/api'

// Aviso acima do conteúdo quando a proteção exige ação (specs/003-bot-protection/design.md).
function tryAgain(): void {
    retryVerification().catch(() => undefined)
}

function waitMessage(seconds: number): string {
    const unit = seconds === 1 ? 'segundo' : 'segundos'
    return `Você fez muitas consultas em pouco tempo. Aguarde ${seconds} ${unit} para consultar de novo.`
}
</script>

<template>
    <div
        v-if="rateLimitRemainingSeconds > 0"
        role="alert"
        class="border-l-4 border-marker bg-sheet px-4 py-3 text-ink"
    >
        <!-- Contagem visível a cada segundo; leitores de tela ouvem só o início e o fim (FR-015). -->
        <p data-countdown aria-hidden="true">{{ waitMessage(rateLimitRemainingSeconds) }}</p>
        <p class="sr-only">{{ waitMessage(rateLimitInitialSeconds) }}</p>
    </div>
    <div
        v-else-if="verificationState === 'failed' || verificationState === 'unsupported'"
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
    <p aria-live="polite" class="sr-only">
        {{ rateLimitHasEnded ? 'Você já pode consultar de novo.' : '' }}
    </p>
</template>
