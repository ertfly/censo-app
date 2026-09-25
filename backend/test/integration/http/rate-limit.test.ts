import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSession } from '../../helpers/create-session.js'
import { createTestServer, type TestServer } from '../../helpers/create-test-server.js'

let server: TestServer | undefined

beforeEach(() => {
    // Só o Date: o @fastify/rate-limit e o bloqueio usam o relógio do sistema.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-25T12:00:00.000Z'))
})

afterEach(async () => {
    vi.useRealTimers()
    await server?.close()
    server = undefined
})

function from(address: string) {
    return { remoteAddress: address }
}

async function hit(current: TestServer, address: string, url = '/api/test-protected') {
    return current.app.inject({ method: 'GET', url, ...from(address) })
}

function blockEvents(current: TestServer): number {
    return readdirSync(current.logDir)
        .flatMap((file) => readFileSync(join(current.logDir, file), 'utf8').trim().split('\n'))
        .filter((line) => line.includes('rate_limit_blocked')).length
}

describe('rate limit', () => {
    it('lets 120 requests through and blocks the 121st for 60 s from the excess', async () => {
        server = await createTestServer({ withProtectedRoute: true, useSystemClock: true })
        for (let index = 0; index < 120; index += 1) {
            expect((await hit(server, '203.0.113.9')).statusCode).toBe(401)
        }
        const blocked = await hit(server, '203.0.113.9')
        expect(blocked.statusCode).toBe(429)
        expect(blocked.json()).toEqual({ code: 'RATE_LIMIT_EXCEEDED', retryAfterSeconds: 60 })
        expect(blocked.headers['retry-after']).toBe('60')

        vi.advanceTimersByTime(59_000)
        expect((await hit(server, '203.0.113.9')).statusCode).toBe(429)

        vi.advanceTimersByTime(1_500)
        expect((await hit(server, '203.0.113.9')).statusCode).toBe(401)
    })

    it('counts and blocks the verification routes too', async () => {
        server = await createTestServer({ useSystemClock: true })
        for (let index = 0; index < 120; index += 1) {
            await hit(server, '198.51.100.1', '/api/challenge')
        }
        expect((await hit(server, '198.51.100.1', '/api/challenge')).statusCode).toBe(429)
        const session = await server.app.inject({
            method: 'POST',
            url: '/api/session',
            payload: { payload: 'x' },
            ...from('198.51.100.1'),
        })
        expect(session.statusCode).toBe(429)
    })

    it('leaves the health check out of the limit', async () => {
        server = await createTestServer({ useSystemClock: true })
        for (let index = 0; index < 130; index += 1) {
            expect((await hit(server, '198.51.100.2', '/api/health')).statusCode).toBe(200)
        }
    })

    it('keeps different accesses apart and groups an IPv6 /64', async () => {
        server = await createTestServer({ withProtectedRoute: true, useSystemClock: true })
        for (let index = 0; index < 121; index += 1) {
            await hit(server, `2001:db8:1:2::${(index % 9) + 1}`)
        }
        expect((await hit(server, '2001:db8:1:2::ffff')).statusCode).toBe(429)
        expect((await hit(server, '2001:db8:1:3::1')).statusCode).toBe(401)
        expect((await hit(server, '203.0.113.50')).statusCode).toBe(401)
    })

    it('logs exactly one event per block', async () => {
        server = await createTestServer({ withProtectedRoute: true, useSystemClock: true })
        for (let index = 0; index < 130; index += 1) {
            await hit(server, '203.0.113.77')
        }
        expect(blockEvents(server)).toBe(1)
    })

    it('never blocks normal use: 30 requests per minute for 10 minutes', async () => {
        server = await createTestServer({ withProtectedRoute: true, useSystemClock: true })
        for (let minute = 0; minute < 10; minute += 1) {
            for (let index = 0; index < 30; index += 1) {
                expect((await hit(server, '203.0.113.20')).statusCode).toBe(401)
                vi.advanceTimersByTime(2_000)
            }
        }
    })

    it('does not block 3 visitors on the same network (90 per minute)', async () => {
        server = await createTestServer({ withProtectedRoute: true, useSystemClock: true })
        for (let second = 0; second < 120; second += 1) {
            for (let visitor = 0; visitor < 3; visitor += 1) {
                if (second % 2 === 0) {
                    expect((await hit(server, '198.51.100.30')).statusCode).toBe(401)
                }
            }
            vi.advanceTimersByTime(1_000)
        }
    })

    it('still allows a session for someone within the limit', async () => {
        server = await createTestServer({ withProtectedRoute: true, useSystemClock: true })
        const cookie = await createSession(server.app)
        const response = await server.app.inject({
            method: 'GET',
            url: '/api/test-protected',
            headers: { cookie },
        })
        expect(response.statusCode).toBe(200)
    })
})
