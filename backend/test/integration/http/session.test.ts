import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { deriveKey } from 'altcha-lib/algorithms/pbkdf2'
import { type Challenge, solveChallenge } from 'altcha-lib'
import { afterEach, describe, expect, it } from 'vitest'
import { createSession } from '../../helpers/create-session.js'
import { createTestServer, type TestServer } from '../../helpers/create-test-server.js'

let server: TestServer | undefined

afterEach(async () => {
    await server?.close()
    server = undefined
})

async function solvedPayload(current: TestServer): Promise<string> {
    const response = await current.app.inject({ method: 'GET', url: '/api/challenge' })
    const challenge = response.json<Challenge>()
    const solution = await solveChallenge({ challenge, deriveKey })
    return Buffer.from(JSON.stringify({ challenge, solution })).toString('base64')
}

function loggedEvents(current: TestServer): Record<string, string>[] {
    return readdirSync(current.logDir).flatMap((file) =>
        readFileSync(join(current.logDir, file), 'utf8')
            .trim()
            .split('\n')
            .filter(Boolean)
            .map((line) => JSON.parse(line) as Record<string, string>),
    )
}

describe('verification and session', () => {
    it('serves an ALTCHA v2 challenge', async () => {
        server = await createTestServer()
        const response = await server.app.inject({ method: 'GET', url: '/api/challenge' })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchObject({
            parameters: { algorithm: 'PBKDF2/SHA-256', nonce: expect.any(String) },
            signature: expect.any(String),
        })
    })

    it('opens a 30-minute session cookie for a valid solution', async () => {
        server = await createTestServer()
        const payload = await solvedPayload(server)
        const response = await server.app.inject({
            method: 'POST',
            url: '/api/session',
            payload: { payload },
        })
        expect(response.statusCode).toBe(200)
        const expiresAt = Date.parse(response.json<{ expiresAt: string }>().expiresAt)
        expect(expiresAt - server.clock.now()).toBe(30 * 60 * 1000)
        const cookie = String(response.headers['set-cookie'])
        expect(cookie).toContain('censo_session=')
        expect(cookie).toContain('HttpOnly')
        expect(cookie).toContain('SameSite=Strict')
        expect(cookie).toContain('Path=/api')
        expect(cookie).not.toContain('Secure')
    })

    it('refuses a replayed solution and logs it', async () => {
        server = await createTestServer()
        const payload = await solvedPayload(server)
        await server.app.inject({ method: 'POST', url: '/api/session', payload: { payload } })
        const replay = await server.app.inject({
            method: 'POST',
            url: '/api/session',
            payload: { payload },
        })
        expect(replay.statusCode).toBe(400)
        expect(replay.json()).toEqual({ code: 'VERIFICATION_FAILED' })
        expect(loggedEvents(server)).toContainEqual(
            expect.objectContaining({ type: 'verification_failed', reason: 'replayed_challenge' }),
        )
    })

    it('refuses an invalid solution and logs it', async () => {
        server = await createTestServer()
        const response = await server.app.inject({ method: 'GET', url: '/api/challenge' })
        const challenge = response.json<Challenge>()
        const payload = Buffer.from(
            JSON.stringify({ challenge, solution: { counter: 1, derivedKey: 'ff' } }),
        ).toString('base64')
        const result = await server.app.inject({
            method: 'POST',
            url: '/api/session',
            payload: { payload },
        })
        expect(result.statusCode).toBe(400)
        expect(result.json()).toEqual({ code: 'VERIFICATION_FAILED' })
        expect(loggedEvents(server)).toContainEqual(
            expect.objectContaining({ type: 'verification_failed', reason: 'invalid_solution' }),
        )
    })

    it('refuses an expired challenge and logs it', async () => {
        server = await createTestServer()
        const payload = await solvedPayload(server)
        server.clock.advance(6 * 60 * 1000)
        const result = await server.app.inject({
            method: 'POST',
            url: '/api/session',
            payload: { payload },
        })
        expect(result.statusCode).toBe(400)
        expect(loggedEvents(server)).toContainEqual(
            expect.objectContaining({ type: 'verification_failed', reason: 'expired_challenge' }),
        )
    })

    it('refuses a garbage payload without crashing', async () => {
        server = await createTestServer()
        const result = await server.app.inject({
            method: 'POST',
            url: '/api/session',
            payload: { payload: 'not-base64-json' },
        })
        expect(result.statusCode).toBe(400)
        expect(result.json()).toEqual({ code: 'VERIFICATION_FAILED' })
    })

    it('requires a valid session on protected routes', async () => {
        server = await createTestServer({ withProtectedRoute: true })
        const url = '/api/test-protected'

        const withoutCookie = await server.app.inject({ method: 'GET', url })
        expect(withoutCookie.statusCode).toBe(401)
        expect(withoutCookie.json()).toEqual({ code: 'SESSION_REQUIRED' })

        const cookie = await createSession(server.app)
        const withCookie = await server.app.inject({ method: 'GET', url, headers: { cookie } })
        expect(withCookie.statusCode).toBe(200)

        const tampered = await server.app.inject({
            method: 'GET',
            url,
            headers: { cookie: cookie.replace(/.$/, (last) => (last === 'a' ? 'b' : 'a')) },
        })
        expect(tampered.statusCode).toBe(401)

        server.clock.advance(30 * 60 * 1000 + 1)
        const expired = await server.app.inject({ method: 'GET', url, headers: { cookie } })
        expect(expired.statusCode).toBe(401)
    })

    it('keeps the health check open', async () => {
        server = await createTestServer()
        const response = await server.app.inject({ method: 'GET', url: '/api/health' })
        expect(response.statusCode).toBe(200)
    })
})
