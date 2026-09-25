import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { ProtectionConfig } from '../../config/protection-config.js'
import type { ProtectionEventLog } from '../../logging/protection-event-log.js'
import { accessKey } from './access-key.js'
import type { Clock } from './clock.js'

// Limite por acesso com bloqueio de 1 minuto a partir do excesso (spec 003 FR-008,
// research R3, ADR 0022). A contagem fica num hook global, antes da exigência de
// sessão: vale para toda requisição /api/*, inclusive rotas inexistentes.

export interface RateLimitOptions {
    config: ProtectionConfig
    clock: Clock
    eventLog: ProtectionEventLog
}

interface AccessWindow {
    startedAt: number
    count: number
    bannedUntil: number
}

const SWEEP_INTERVAL_MS = 60 * 1000

function isLimited(request: FastifyRequest): boolean {
    const path = request.url.split('?')[0] ?? request.url
    return path.startsWith('/api/') && path !== '/api/health'
}

function sendBlocked(reply: FastifyReply, retryAfterSeconds: number): FastifyReply {
    return reply
        .header('Retry-After', String(retryAfterSeconds))
        .status(429)
        .send({ code: 'RATE_LIMIT_EXCEEDED', retryAfterSeconds })
}

export function registerRateLimit(
    app: FastifyInstance,
    { config, clock, eventLog }: RateLimitOptions,
): void {
    const windowMs = config.rateLimitWindowSeconds * 1000
    const banMs = config.rateLimitBanSeconds * 1000
    const accesses = new Map<string, AccessWindow>()

    app.addHook('onRequest', async (request, reply) => {
        if (!isLimited(request)) {
            return
        }
        const now = clock.now()
        const key = accessKey(request.ip)
        let access = accesses.get(key)

        if (access && access.bannedUntil > now) {
            return sendBlocked(reply, Math.ceil((access.bannedUntil - now) / 1000))
        }
        if (!access || now - access.startedAt >= windowMs) {
            access = { startedAt: now, count: 0, bannedUntil: 0 }
            accesses.set(key, access)
        }

        access.count += 1
        if (access.count > config.rateLimitMax) {
            access.bannedUntil = now + banMs
            eventLog.record({ type: 'rate_limit_blocked', accessKey: key })
            return sendBlocked(reply, config.rateLimitBanSeconds)
        }
    })

    // Remove acessos com janela e bloqueio vencidos, para a memória não crescer.
    const sweep = setInterval(() => {
        const now = clock.now()
        for (const [key, access] of accesses) {
            if (now - access.startedAt >= windowMs && access.bannedUntil <= now) {
                accesses.delete(key)
            }
        }
    }, SWEEP_INTERVAL_MS)
    sweep.unref()
    app.addHook('onClose', async () => clearInterval(sweep))
}
