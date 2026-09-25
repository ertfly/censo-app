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

function get(url: string, withSession = true) {
    return server.app.inject({ method: 'GET', url, headers: withSession ? { cookie } : {} })
}

describe('GET /api/states', () => {
    it('lists the states in the contract format', async () => {
        const response = await get('/api/states')
        expect(response.statusCode).toBe(200)
        const body = response.json<{ items: unknown[] }>()
        expect(body.items).toHaveLength(9)
        expect(body.items[0]).toEqual({ code: '29', abbreviation: 'BA', name: 'Bahia' })
    })

    it('requires a session', async () => {
        const response = await get('/api/states', false)
        expect(response.statusCode).toBe(401)
        expect(response.json()).toEqual({ code: 'SESSION_REQUIRED' })
    })
})

describe('GET /api/states/:stateCode/density-ranking', () => {
    it('returns totals and ranking in the contract format', async () => {
        const response = await get('/api/states/53/density-ranking')
        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({
            state: { code: '53', abbreviation: 'DF', name: 'Distrito Federal' },
            totals: {
                population: 800,
                areaKm2: 10,
                populationDensity: 80,
                areaOutsideMunicipalitiesKm2: 0,
            },
            items: [
                {
                    position: 1,
                    code: '5300108',
                    name: 'Brasília',
                    population: 800,
                    areaKm2: 10,
                    populationDensity: 80,
                },
            ],
        })
    })

    it.each(['99', 'abc', '3'])('answers INVALID_STATE_CODE for "%s"', async (code) => {
        const response = await get(`/api/states/${code}/density-ranking`)
        expect(response.statusCode).toBe(400)
        expect(response.json()).toEqual({ code: 'INVALID_STATE_CODE' })
    })

    it('requires a session', async () => {
        const response = await get('/api/states/53/density-ranking', false)
        expect(response.statusCode).toBe(401)
        expect(response.json()).toEqual({ code: 'SESSION_REQUIRED' })
    })
})
