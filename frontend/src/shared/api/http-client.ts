import { ApiError, request } from './request'
import { ensureSession, invalidateSession } from './session'

export { ApiError } from './request'

// Consulta à API com sessão: espera a verificação e, se o servidor recusar a
// sessão, verifica de novo uma vez e repete a consulta (spec 003 FR-005).
export async function getJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    await ensureSession()
    try {
        return await request<T>(path, init)
    } catch (error) {
        if (error instanceof ApiError && error.code === 'SESSION_REQUIRED') {
            invalidateSession()
            await ensureSession()
            return request<T>(path, init)
        }
        throw error
    }
}
