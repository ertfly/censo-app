import cookie from '@fastify/cookie'
import type { FastifyInstance } from 'fastify'
import type { Clock } from './clock.js'
import { hasValidSession } from './session-cookie.js'

// Rotas /api/* abertas sem sessão (spec 003, contracts/api.md).
const OPEN_ROUTES = new Set(['/api/challenge', '/api/session', '/api/health'])

export interface SessionGuardOptions {
    sessionSecret: string
    clock: Clock
}

// Registrado na raiz (sem encapsulamento), para valer em todas as rotas.
export async function registerSessionGuard(
    app: FastifyInstance,
    options: SessionGuardOptions,
): Promise<void> {
    await app.register(cookie, { secret: options.sessionSecret })

    app.addHook('onRequest', async (request, reply) => {
        const path = request.url.split('?')[0] ?? request.url
        if (!path.startsWith('/api/') || OPEN_ROUTES.has(path)) {
            return
        }
        if (!hasValidSession(request, options.clock.now())) {
            return reply.status(401).send({ code: 'SESSION_REQUIRED' })
        }
    })
}
