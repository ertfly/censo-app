import { Writable } from 'node:stream'
import { afterEach, describe, expect, it } from 'vitest'
import { registerErrorHandler } from '#infra/http/error-handler.js'
import { healthRoutes } from '#infra/http/routes/health.routes.js'
import { createServer } from '#infra/http/server.js'

function createLogCollector(): { stream: Writable; lines: string[] } {
    const lines: string[] = []
    const stream = new Writable({
        write(chunk: Buffer, _encoding, callback) {
            lines.push(chunk.toString())
            callback()
        },
    })
    return { stream, lines }
}

async function createApp(stream?: Writable) {
    const app = createServer({ trustedProxyCidr: '172.28.0.0/24', logStream: stream })
    registerErrorHandler(app)
    await app.register(healthRoutes)
    app.get('/api/boom', () => {
        throw new Error('internal detail that must not leak')
    })
    return app
}

describe('health and error handling', () => {
    let app: Awaited<ReturnType<typeof createApp>> | undefined

    afterEach(async () => {
        await app?.close()
    })

    it('answers the health check', async () => {
        app = await createApp()
        const response = await app.inject({ method: 'GET', url: '/api/health' })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({ status: 'ok' })
    })

    it('turns an unhandled error into INTERNAL_ERROR without details', async () => {
        app = await createApp()
        const response = await app.inject({ method: 'GET', url: '/api/boom' })
        expect(response.statusCode).toBe(500)
        expect(response.json()).toEqual({ code: 'INTERNAL_ERROR' })
    })

    it('answers unknown routes with NOT_FOUND', async () => {
        app = await createApp()
        const response = await app.inject({ method: 'GET', url: '/api/unknown' })
        expect(response.statusCode).toBe(404)
        expect(response.json()).toEqual({ code: 'NOT_FOUND' })
    })

    it('never writes the source address to the logs', async () => {
        const { stream, lines } = createLogCollector()
        app = await createApp(stream)
        await app.inject({
            method: 'GET',
            url: '/api/health',
            remoteAddress: '203.0.113.9',
            headers: { 'x-forwarded-for': '198.51.100.7' },
        })
        const logs = lines.join('\n')
        expect(logs).toContain('/api/health')
        expect(logs).not.toContain('203.0.113.9')
        expect(logs).not.toContain('198.51.100.7')
        expect(logs).not.toMatch(/remoteAddress|remotePort/)
    })
})
