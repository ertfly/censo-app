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

// Bloqueio por excesso de consultas (spec 003 FR-009, FR-021): relógio reativo,
// atualizado a cada segundo só enquanto o bloqueio dura.
const rateLimitedUntil = ref(0)
const rateLimitSeconds = ref(0)
const currentTime = ref(Date.now())
const rateLimitEnded = ref(false)
let rateLimitTimer: ReturnType<typeof setInterval> | null = null

export const rateLimitRemainingSeconds = computed(() =>
    Math.max(0, Math.ceil((rateLimitedUntil.value - currentTime.value) / 1000)),
)
export const rateLimitInitialSeconds = readonly(rateLimitSeconds)
export const rateLimitHasEnded = readonly(rateLimitEnded)

// Já houve sessão nesta aba: uma nova verificação (sessão expirada) não muda a
// tela (specs/003-bot-protection/design.md, "Reverificando").
const verifiedOnce = ref(false)

// Por que as consultas estão indisponíveis agora, ou null (FR-006, FR-007, FR-009).
export type QueryBlockReason = 'verifying' | 'verification-failed' | 'rate-limited'

export const queryBlockReason = computed<QueryBlockReason | null>(() => {
    if (rateLimitRemainingSeconds.value > 0) {
        return 'rate-limited'
    }
    if (state.value === 'failed' || state.value === 'unsupported') {
        return 'verification-failed'
    }
    if (state.value === 'verifying' && !verifiedOnce.value) {
        return 'verifying'
    }
    return null
})

export const queriesBlocked = computed(() => queryBlockReason.value !== null)

export function markRateLimited(seconds: number): void {
    currentTime.value = Date.now()
    rateLimitedUntil.value = currentTime.value + seconds * 1000
    rateLimitSeconds.value = seconds
    rateLimitEnded.value = false
    if (rateLimitTimer) {
        clearInterval(rateLimitTimer)
    }
    rateLimitTimer = setInterval(() => {
        currentTime.value = Date.now()
        if (currentTime.value >= rateLimitedUntil.value) {
            if (rateLimitTimer) {
                clearInterval(rateLimitTimer)
            }
            rateLimitTimer = null
            rateLimitEnded.value = true
        }
    }, 1000)
}

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

function currentState(): VerificationState {
    return state.value
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
        verifiedOnce.value = true
    } catch (error) {
        if (error instanceof ApiError && error.status === 429) {
            // Bloqueado: a verificação volta a ser tentada na próxima consulta.
            markRateLimited(error.retryAfterSeconds ?? 60)
            state.value = 'idle'
            throw error
        }
        // markUnsupported() pode ter rodado durante a verificação.
        if (currentState() !== 'unsupported') {
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
        verifiedOnce.value = true
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
    verifiedOnce.value = false
    if (rateLimitTimer) {
        clearInterval(rateLimitTimer)
    }
    rateLimitTimer = null
    rateLimitedUntil.value = 0
    rateLimitSeconds.value = 0
    rateLimitEnded.value = false
    currentTime.value = Date.now()
    if (!options.keepStorage) {
        writeExpiry(null)
    }
}

export function setVerificationStateForTests(value: VerificationState): void {
    state.value = value
}
