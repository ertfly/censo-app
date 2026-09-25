import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getJson } from '@/shared/api/http-client'
import {
    ensureSession,
    registerVerifier,
    resetSessionForTests,
    verificationState,
} from '@/shared/api/session'

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status })
}

const SESSION_OK = { expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() }

beforeEach(() => {
    resetSessionForTests()
    localStorage.clear()
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('session', () => {
    it('runs a single verification for many simultaneous queries', async () => {
        const verifier = vi.fn(() => Promise.resolve('payload'))
        registerVerifier(verifier)
        const fetchMock = vi.fn((url: string) =>
            Promise.resolve(
                url === '/api/session' ? jsonResponse(SESSION_OK) : jsonResponse({ ok: 1 }),
            ),
        )
        vi.stubGlobal('fetch', fetchMock)

        await Promise.all([getJson('/a'), getJson('/b'), getJson('/c')])

        expect(verifier).toHaveBeenCalledTimes(1)
        expect(fetchMock.mock.calls.filter(([url]) => url === '/api/session')).toHaveLength(1)
        expect(verificationState.value).toBe('verified')
    })

    it('does not verify again while the stored session is valid', async () => {
        const verifier = vi.fn(() => Promise.resolve('payload'))
        registerVerifier(verifier)
        vi.stubGlobal(
            'fetch',
            vi.fn((url: string) =>
                Promise.resolve(
                    url === '/api/session' ? jsonResponse(SESSION_OK) : jsonResponse({}),
                ),
            ),
        )
        await ensureSession()
        resetSessionForTests({ keepStorage: true })
        registerVerifier(verifier)
        await ensureSession()
        expect(verifier).toHaveBeenCalledTimes(1)
    })

    it('verifies again once and repeats the query on SESSION_REQUIRED', async () => {
        const verifier = vi.fn(() => Promise.resolve('payload'))
        registerVerifier(verifier)
        let queries = 0
        vi.stubGlobal(
            'fetch',
            vi.fn((url: string) => {
                if (url === '/api/session') {
                    return Promise.resolve(jsonResponse(SESSION_OK))
                }
                queries += 1
                return Promise.resolve(
                    queries === 1
                        ? jsonResponse({ code: 'SESSION_REQUIRED' }, 401)
                        : jsonResponse({ ok: true }),
                )
            }),
        )

        await expect(getJson('/states')).resolves.toEqual({ ok: true })
        expect(verifier).toHaveBeenCalledTimes(2)
        expect(queries).toBe(2)
    })

    it('stops after a second refusal in a row instead of looping', async () => {
        const verifier = vi.fn(() => Promise.resolve('payload'))
        registerVerifier(verifier)
        vi.stubGlobal(
            'fetch',
            vi.fn((url: string) =>
                Promise.resolve(
                    url === '/api/session'
                        ? jsonResponse(SESSION_OK)
                        : jsonResponse({ code: 'SESSION_REQUIRED' }, 401),
                ),
            ),
        )

        await expect(getJson('/states')).rejects.toMatchObject({ code: 'SESSION_REQUIRED' })
        expect(verifier).toHaveBeenCalledTimes(2)
    })

    it('marks the verification as failed when the server refuses it', async () => {
        registerVerifier(() => Promise.resolve('payload'))
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(jsonResponse({ code: 'VERIFICATION_FAILED' }, 400))),
        )
        await expect(ensureSession()).rejects.toMatchObject({ code: 'VERIFICATION_FAILED' })
        expect(verificationState.value).toBe('failed')
    })
})
