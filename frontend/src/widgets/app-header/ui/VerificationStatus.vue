<script setup lang="ts">
import type { GetChallengeResponse } from '@censo/contracts'
import { computed, onMounted, ref } from 'vue'
import {
    ensureSession,
    markUnsupported,
    registerVerifier,
    request,
    verificationState,
} from '@/shared/api'
import { loadAltcha } from '../lib/load-altcha'

// Widget do ALTCHA invisível: só produz a solução. O status visível é nosso
// (specs/003-bot-protection/design.md).
interface AltchaWidgetElement extends HTMLElement {
    configure: (config: { challenge: GetChallengeResponse }) => Promise<void>
    verify: () => Promise<{ payload: string } | null>
}

const widget = ref<AltchaWidgetElement | null>(null)

function browserSupportsVerification(): boolean {
    return typeof Worker !== 'undefined' && globalThis.crypto?.subtle !== undefined
}

onMounted(async () => {
    if (!browserSupportsVerification()) {
        markUnsupported()
        return
    }
    try {
        await loadAltcha()
    } catch {
        markUnsupported()
        return
    }
    registerVerifier(async () => {
        // O desafio passa pelo nosso cliente, que trata o bloqueio (429); o widget
        // só resolve o cálculo.
        const challenge = await request<GetChallengeResponse>('/challenge')
        await widget.value?.configure({ challenge })
        const result = await widget.value?.verify()
        if (!result?.payload) {
            throw new Error('The ALTCHA widget did not produce a solution')
        }
        return result.payload
    })
    // Verificação automática ao abrir a página (FR-002); falhas aparecem no aviso.
    ensureSession().catch(() => undefined)
})

const message = computed(() => {
    if (verificationState.value === 'verifying') {
        return 'Verificando o navegador'
    }
    if (verificationState.value === 'failed') {
        return 'Verificação não concluída'
    }
    return ''
})
</script>

<template>
    <div class="flex items-center gap-2 text-sm">
        <altcha-widget ref="widget" display="invisible" auto="off" language="pt-br" />
        <span
            v-if="verificationState === 'verifying'"
            aria-hidden="true"
            class="size-3 rounded-full border-2 border-ink-muted/30 border-t-ink-muted motion-safe:animate-spin"
        />
        <span
            aria-live="polite"
            :class="verificationState === 'failed' ? 'text-ink' : 'text-ink-muted'"
            >{{ message }}</span
        >
    </div>
</template>
