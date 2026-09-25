import type { CreateSessionResponse } from '@censo/contracts'
import { computed, readonly, ref } from 'vue'
import { ApiError, request } from './request'

// Verificação contra bots e sessão (spec 003, research R6). A validade fica no
// localStorage para valer em todas as abas (FR-004); o cookie é HttpOnly.

export type VerificationState = 'idle' | 'verifying' | 'verified' | 'failed' | 'unsupported'
// Resolve o desafio e devolve o payload (fornecido pelo widget ALTCHA).
export type Verifier = () => Promise<string>

const EXPIRES_AT_KEY = 'censo:session-expires-at'

const state = ref<VerificationState>('idle')
export const verificationState = readonly(state)
// Consultas ficam indisponíveis enquanto a verificação não conclui (FR-006).
export const queriesBlocked = computed(() => state.value !== 'verified' && state.value !== 'idle')

let verifier: Verifier | null = null
let verifierWaiters: ((fn: Verifier) => void)[] = []
let pending: Promise<void> | null = null

function readExpiry(): number {
    try {
        return Number(localStorage.getItem(EXPIRES_AT_KEY)) || 0
    } catch {
        return 0
    }
}

function writeExpiry(expiresAtMs: number | null): void {
    try {
        if (expiresAtMs === null) {
            localStorage.removeItem(EXPIRES_AT_KEY)
        } else {
            localStorage.setItem(EXPIRES_AT_KEY, String(expiresAtMs))
        }
    } catch {
        // Sem armazenamento local: cada aba verifica por conta própria.
    }
}

function waitForVerifier(): Promise<Verifier> {
    if (verifier) {
        return Promise.resolve(verifier)
    }
    return new Promise((resolve) => verifierWaiters.push(resolve))
}

export function registerVerifier(fn: Verifier): void {
    verifier = fn
    for (const resolve of verifierWaiters) {
        resolve(fn)
    }
    verifierWaiters = []
}

export function markUnsupported(): void {
    state.value = 'unsupported'
}

async function verify(): Promise<void> {
    state.value = 'verifying'
    try {
        const fn = await waitForVerifier()
        const payload = await fn()
        const response = await request<CreateSessionResponse>('/session', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ payload }),
        })
        writeExpiry(Date.parse(response.expiresAt))
        state.value = 'verified'
    } catch (error) {
        if (state.value !== 'unsupported') {
            state.value = 'failed'
        }
        throw error
    }
}

// Uma única verificação em andamento, compartilhada por todas as consultas.
export function ensureSession(): Promise<void> {
    if (state.value === 'unsupported') {
        return Promise.reject(new ApiError('VERIFICATION_UNSUPPORTED', 0))
    }
    if (readExpiry() > Date.now()) {
        state.value = 'verified'
        return Promise.resolve()
    }
    pending ??= verify().finally(() => {
        pending = null
    })
    return pending
}

export function invalidateSession(): void {
    writeExpiry(null)
    if (state.value === 'verified') {
        state.value = 'idle'
    }
}

export function retryVerification(): Promise<void> {
    if (state.value === 'failed') {
        state.value = 'idle'
    }
    return ensureSession()
}

// Só para testes.
export function resetSessionForTests(options: { keepStorage?: boolean } = {}): void {
    verifier = null
    verifierWaiters = []
    pending = null
    state.value = 'idle'
    if (!options.keepStorage) {
        writeExpiry(null)
    }
}

export function setVerificationStateForTests(value: VerificationState): void {
    state.value = value
}
