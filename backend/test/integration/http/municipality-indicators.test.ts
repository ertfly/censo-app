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

function indicators(code: string, withSession = true) {
    return server.app.inject({
        method: 'GET',
        url: `/api/municipalities/${code}`,
        headers: withSession ? { cookie } : {},
    })
}

describe('GET /api/municipalities/:municipalityCode', () => {
    it('returns the indicators in the contract format', async () => {
        const response = await indicators('5300108')
        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({
            code: '5300108',
            name: 'Brasília',
            state: { code: '53', abbreviation: 'DF', name: 'Distrito Federal' },
            population: 800,
            censusTractCount: 2,
            areaKm2: 10,
            populationDensity: 80,
            areaTypeBreakdown: [
                { areaType: 'urban', censusTractCount: 1, population: 700 },
                { areaType: 'rural', censusTractCount: 1, population: 100 },
            ],
            sexBreakdown: { men: 390, women: 50, unknown: 360 },
        })
    })

    it.each(['abc', '123', '9999999'])(
        'answers INVALID_MUNICIPALITY_CODE for "%s"',
        async (code) => {
            const response = await indicators(code)
            expect(response.statusCode).toBe(400)
            expect(response.json()).toEqual({ code: 'INVALID_MUNICIPALITY_CODE' })
        },
    )

    it('answers MUNICIPALITY_NOT_FOUND for a valid code without a municipality', async () => {
        const response = await indicators('3500000')
        expect(response.statusCode).toBe(404)
        expect(response.json()).toEqual({ code: 'MUNICIPALITY_NOT_FOUND' })
    })

    it('does not confuse the suggestions route with a code', async () => {
        const response = await indicators('suggestions?q=sao')
        expect(response.statusCode).toBe(200)
    })

    it('requires a session', async () => {
        const response = await indicators('5300108', false)
        expect(response.statusCode).toBe(401)
        expect(response.json()).toEqual({ code: 'SESSION_REQUIRED' })
    })
})
