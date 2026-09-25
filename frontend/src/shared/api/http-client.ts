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

interface ErrorBody extends ErrorResponse {
    retryAfterSeconds?: number
}

export async function getJson<T>(path: string, init: RequestInit = {}): Promise<T> {
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
        const body = (await response.json().catch(() => null)) as ErrorBody | null
        throw new ApiError(body?.code ?? 'INTERNAL_ERROR', response.status, body?.retryAfterSeconds)
    }
    return (await response.json()) as T
}
