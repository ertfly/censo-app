import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { errorMessage } from '@/shared/api/error-messages'
import { ApiError, getJson } from '@/shared/api/http-client'
import { resetSessionForTests } from '@/shared/api/session'

function mockFetch(response: Response | Error): void {
    vi.stubGlobal(
        'fetch',
        vi.fn(() =>
            response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
        ),
    )
}

// As consultas exigem sessão (spec 003); aqui a sessão já está válida.
beforeEach(() => {
    resetSessionForTests()
    localStorage.setItem('censo:session-expires-at', String(Date.now() + 60_000))
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('getJson', () => {
    it('prefixes the path with /api and returns the body', async () => {
        mockFetch(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }))
        await expect(getJson('/health')).resolves.toEqual({ status: 'ok' })
        expect(fetch).toHaveBeenCalledWith('/api/health', expect.anything())
    })

    it('turns an error response into ApiError with the API code', async () => {
        mockFetch(new Response(JSON.stringify({ code: 'MUNICIPALITY_NOT_FOUND' }), { status: 404 }))
        await expect(getJson('/municipalities/9999999')).rejects.toMatchObject({
            code: 'MUNICIPALITY_NOT_FOUND',
            status: 404,
        })
    })

    it('keeps retryAfterSeconds when the API sends it', async () => {
        mockFetch(
            new Response(JSON.stringify({ code: 'RATE_LIMIT_EXCEEDED', retryAfterSeconds: 42 }), {
                status: 429,
            }),
        )
        await expect(getJson('/states')).rejects.toMatchObject({ retryAfterSeconds: 42 })
    })

    it('reports a network failure as NETWORK_ERROR', async () => {
        mockFetch(new TypeError('Failed to fetch'))
        await expect(getJson('/states')).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: 0 })
    })
})

describe('errorMessage', () => {
    it('explains invalid addresses in Portuguese', () => {
        const message = 'Este endereço não corresponde a nenhum município. Busque pelo nome.'
        expect(errorMessage(new ApiError('MUNICIPALITY_NOT_FOUND', 404))).toBe(message)
        expect(errorMessage(new ApiError('INVALID_MUNICIPALITY_CODE', 400))).toBe(message)
    })

    it('asks for at least 2 letters on an invalid search term', () => {
        expect(errorMessage(new ApiError('INVALID_SEARCH_TERM', 400))).toBe(
            'Digite pelo menos 2 letras.',
        )
    })

    it('falls back to a generic message for unknown codes and failures', () => {
        const generic = 'Não foi possível carregar os dados.'
        expect(errorMessage(new ApiError('INTERNAL_ERROR', 500))).toBe(generic)
        expect(errorMessage(new ApiError('NETWORK_ERROR', 0))).toBe(generic)
        expect(errorMessage(new Error('anything'))).toBe(generic)
    })
})
