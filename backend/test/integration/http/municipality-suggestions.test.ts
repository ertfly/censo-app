import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createSession } from '../../helpers/create-session.js'
import { createTestServer, type TestServer } from '../../helpers/create-test-server.js'

let server: TestServer
let cookie: string

beforeAll(async () => {
    server = await createTestServer()
    cookie = await createSession(server.app)
})

afterAll(async () => {
    await server.close()
})

function suggestions(query: string, withSession = true) {
    return server.app.inject({
        method: 'GET',
        url: `/api/municipalities/suggestions${query}`,
        headers: withSession ? { cookie } : {},
    })
}

describe('GET /api/municipalities/suggestions', () => {
    it('returns suggestions in the contract format', async () => {
        const response = await suggestions('?q=sao%20pau')
        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({
            items: [
                { code: '3550308', name: 'São Paulo', stateCode: '35', stateAbbreviation: 'SP' },
            ],
        })
    })

    it('returns an empty list when nothing matches', async () => {
        const response = await suggestions('?q=xyz')
        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({ items: [] })
    })

    it.each(['', '?q=', '?q=s', `?q=${'x'.repeat(61)}`])(
        'answers INVALID_SEARCH_TERM for "%s"',
        async (query) => {
            const response = await suggestions(query)
            expect(response.statusCode).toBe(400)
            expect(response.json()).toEqual({ code: 'INVALID_SEARCH_TERM' })
        },
    )

    it('requires a session', async () => {
        const response = await suggestions('?q=sao', false)
        expect(response.statusCode).toBe(401)
        expect(response.json()).toEqual({ code: 'SESSION_REQUIRED' })
    })
})
