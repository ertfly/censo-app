import { type Challenge, solveChallenge } from 'altcha-lib'
import { deriveKey } from 'altcha-lib/algorithms/pbkdf2'
import type { App } from '#infra/http/build-app.js'

// Obtém uma sessão como um navegador: pede o desafio, resolve e envia a solução.
// Devolve o cabeçalho `cookie` para as requisições dos testes da 001 e da 002.
export async function createSession(
    app: App,
    headers: Record<string, string> = {},
): Promise<string> {
    const challengeResponse = await app.inject({ method: 'GET', url: '/api/challenge', headers })
    const challenge = challengeResponse.json<Challenge>()
    const solution = await solveChallenge({ challenge, deriveKey })
    if (!solution) {
        throw new Error('Could not solve the ALTCHA challenge in the test')
    }
    const payload = Buffer.from(JSON.stringify({ challenge, solution })).toString('base64')
    const sessionResponse = await app.inject({
        method: 'POST',
        url: '/api/session',
        payload: { payload },
        headers,
    })
    if (sessionResponse.statusCode !== 200) {
        throw new Error(`Session was refused: ${sessionResponse.body}`)
    }
    const setCookie = sessionResponse.headers['set-cookie']
    const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie
    const cookie = raw?.split(';')[0]
    if (!cookie) {
        throw new Error('The session response did not set a cookie')
    }
    return cookie
}
