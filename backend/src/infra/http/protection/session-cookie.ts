import { randomUUID } from 'node:crypto'
import type { FastifyReply, FastifyRequest } from 'fastify'

// Cookie de sessão assinado, sem estado no servidor (research R2 da 003).
export const SESSION_COOKIE = 'censo_session'

export function setSessionCookie(
    reply: FastifyReply,
    expiresAtMs: number,
    ttlSeconds: number,
): void {
    reply.setCookie(SESSION_COOKIE, `${expiresAtMs}.${randomUUID()}`, {
        signed: true,
        httpOnly: true,
        sameSite: 'strict',
        path: '/api',
        maxAge: ttlSeconds,
        // Sem HTTPS na execução local (ADR 0016); obrigatório ao expor na internet.
        secure: false,
    })
}

export function hasValidSession(request: FastifyRequest, now: number): boolean {
    const raw = request.cookies[SESSION_COOKIE]
    if (!raw) {
        return false
    }
    const unsigned = request.unsignCookie(raw)
    if (!unsigned.valid || unsigned.value === null) {
        return false
    }
    const expiresAtMs = Number(unsigned.value.split('.')[0])
    return Number.isFinite(expiresAtMs) && expiresAtMs > now
}
