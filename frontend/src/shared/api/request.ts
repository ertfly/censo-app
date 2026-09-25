import type { ErrorResponse } from '@censo/contracts'

// Erro da API com o código em inglês; a mensagem ao visitante vem de error-messages.ts.
export class ApiError extends Error {
    constructor(
        readonly code: string,
        readonly status: number,
        readonly retryAfterSeconds?: number,
    ) {
        super(code)
    }
}

// Requisição crua à API, sem sessão (usada também para abrir a sessão).
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response
    try {
        response = await fetch(`/api${path}`, {
            ...init,
            headers: { accept: 'application/json', ...init.headers },
        })
    } catch {
        throw new ApiError('NETWORK_ERROR', 0)
    }

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ErrorResponse | null
        throw new ApiError(body?.code ?? 'INTERNAL_ERROR', response.status, body?.retryAfterSeconds)
    }
    return (await response.json()) as T
}
