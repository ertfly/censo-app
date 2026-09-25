import { afterEach, describe, expect, it } from 'vitest'
import { createTestServer, type TestServer } from '../../helpers/create-test-server.js'

let server: TestServer | undefined

afterEach(async () => {
    await server?.close()
    server = undefined
})

async function exhaust(current: TestServer, remoteAddress: string, forwardedFor: string) {
    let last = 0
    for (let index = 0; index < 121; index += 1) {
        const response = await current.app.inject({
            method: 'GET',
            url: '/api/test-protected',
            remoteAddress,
            headers: { 'x-forwarded-for': forwardedFor },
        })
        last = response.statusCode
    }
    return last
}

describe('trusted proxy', () => {
    it('uses X-Forwarded-For only when the request comes from the proxy network', async () => {
        server = await createTestServer({
            withProtectedRoute: true,
            trustedProxyCidr: '172.28.0.0/24',
        })
        expect(await exhaust(server, '172.28.0.5', '203.0.113.1')).toBe(429)
        const otherVisitor = await server.app.inject({
            method: 'GET',
            url: '/api/test-protected',
            remoteAddress: '172.28.0.5',
            headers: { 'x-forwarded-for': '203.0.113.2' },
        })
        expect(otherVisitor.statusCode).toBe(401)
    })

    it('ignores X-Forwarded-For sent by anyone else', async () => {
        server = await createTestServer({
            withProtectedRoute: true,
            trustedProxyCidr: '172.28.0.0/24',
        })
        expect(await exhaust(server, '198.51.100.9', '203.0.113.3')).toBe(429)
        const spoofed = await server.app.inject({
            method: 'GET',
            url: '/api/test-protected',
            remoteAddress: '198.51.100.9',
            headers: { 'x-forwarded-for': '203.0.113.4' },
        })
        expect(spoofed.statusCode).toBe(429)
    })
})
