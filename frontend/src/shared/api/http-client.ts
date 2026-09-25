import { ApiError, request } from './request'
import { ensureSession, invalidateSession, markRateLimited } from './session'

export { ApiError } from './request'

function noteRateLimit(error: unknown): void {
    if (error instanceof ApiError && error.status === 429) {
        markRateLimited(error.retryAfterSeconds ?? 60)
    }
}

// Consulta à API com sessão: espera a verificação e, se o servidor recusar a
// sessão, verifica de novo uma vez e repete a consulta (spec 003 FR-005). Um
// bloqueio por excesso não é repetido automaticamente (FR-021).
export async function getJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    await ensureSession()
    try {
        return await request<T>(path, init)
    } catch (error) {
        noteRateLimit(error)
        if (error instanceof ApiError && error.code === 'SESSION_REQUIRED') {
            invalidateSession()
            await ensureSession()
            try {
                return await request<T>(path, init)
            } catch (retryError) {
                noteRateLimit(retryError)
                throw retryError
            }
        }
        throw error
    }
}
