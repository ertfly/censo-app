import type { APIRequestContext } from '@playwright/test'
import { type Challenge, solveChallenge } from 'altcha-lib'
import { deriveKey } from 'altcha-lib/algorithms/pbkdf2'

// Abre uma sessão por requisição direta, resolvendo o desafio como um navegador
// faria. O cookie fica guardado no próprio contexto de requisições.
export async function createApiSession(request: APIRequestContext): Promise<void> {
    const challenge = (await (await request.get('/api/challenge')).json()) as Challenge
    const solution = await solveChallenge({ challenge, deriveKey })
    const payload = Buffer.from(JSON.stringify({ challenge, solution })).toString('base64')
    const response = await request.post('/api/session', { data: { payload } })
    if (!response.ok()) {
        throw new Error(`Session was refused: ${await response.text()}`)
    }
}
