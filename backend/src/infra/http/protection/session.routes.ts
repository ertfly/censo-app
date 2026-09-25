import { createHmac } from 'node:crypto'
import {
    CreateSessionBody,
    CreateSessionResponse,
    ErrorResponse,
    GetChallengeResponse,
} from '@censo/contracts'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import {
    type Challenge,
    createChallenge,
    randomInt,
    type Solution,
    verifySolution,
} from 'altcha-lib'
import { deriveKey } from 'altcha-lib/algorithms/pbkdf2'
import type { ProtectionConfig } from '../../config/protection-config.js'
import type { ProtectionEventLog } from '../../logging/protection-event-log.js'
import { accessKey } from './access-key.js'
import type { UsedChallengeStore } from './challenge-store.js'
import type { Clock } from './clock.js'
import { setSessionCookie } from './session-cookie.js'

const ALGORITHM = 'PBKDF2/SHA-256'
const CHALLENGE_TTL_MS = 5 * 60 * 1000

export interface SessionRoutesOptions {
    config: ProtectionConfig
    clock: Clock
    usedChallenges: UsedChallengeStore
    eventLog: ProtectionEventLog
}

interface VerificationPayload {
    challenge: Challenge
    solution: Solution
}

function decodePayload(payload: string): VerificationPayload | null {
    try {
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as unknown
        if (
            typeof decoded === 'object' &&
            decoded !== null &&
            'challenge' in decoded &&
            'solution' in decoded
        ) {
            return decoded as VerificationPayload
        }
    } catch {
        // Payload malformado: tratado como solução inválida.
    }
    return null
}

// Segundo segredo, para assinar as chaves derivadas, derivado do ALTCHA_HMAC_KEY.
function keySignatureSecret(hmacKey: string): string {
    return createHmac('sha256', hmacKey).update('altcha-key-signature').digest('hex')
}

export const sessionRoutes: FastifyPluginAsyncTypebox<SessionRoutesOptions> = async (
    app,
    { config, clock, usedChallenges, eventLog },
) => {
    const keySecret = keySignatureSecret(config.altchaHmacKey)

    app.get('/api/challenge', { schema: { response: { 200: GetChallengeResponse } } }, () => {
        const counterMax = config.altchaCounterMax
        return createChallenge({
            algorithm: ALGORITHM,
            cost: config.altchaCost,
            counter: randomInt(counterMax, Math.ceil(counterMax / 2)),
            deriveKey,
            hmacSignatureSecret: config.altchaHmacKey,
            hmacKeySignatureSecret: keySecret,
            expiresAt: new Date(clock.now() + CHALLENGE_TTL_MS),
        })
    })

    app.post(
        '/api/session',
        {
            schema: {
                body: CreateSessionBody,
                response: { 200: CreateSessionResponse, 400: ErrorResponse },
            },
            config: { validationErrorCode: 'VERIFICATION_FAILED' },
        },
        async (request, reply) => {
            const key = accessKey(request.ip)
            const fail = (
                reason: 'invalid_solution' | 'expired_challenge' | 'replayed_challenge',
            ) => {
                eventLog.record({ type: 'verification_failed', accessKey: key, reason })
                return reply.status(400).send({ code: 'VERIFICATION_FAILED' })
            }

            const decoded = decodePayload(request.body.payload)
            const signature = decoded?.challenge.signature
            if (!decoded || !signature) {
                return fail('invalid_solution')
            }

            const expiresAtMs = (decoded.challenge.parameters.expiresAt ?? 0) * 1000
            if (expiresAtMs <= clock.now()) {
                return fail('expired_challenge')
            }
            // Antes de verificar: uma solução válida reenviada passaria no verifySolution.
            if (usedChallenges.isUsed(signature)) {
                return fail('replayed_challenge')
            }

            const result = await verifySolution({
                challenge: decoded.challenge,
                solution: decoded.solution,
                deriveKey,
                hmacSignatureSecret: config.altchaHmacKey,
                hmacKeySignatureSecret: keySecret,
            })
            if (result.expired) {
                return fail('expired_challenge')
            }
            if (!result.verified) {
                return fail('invalid_solution')
            }
            usedChallenges.markUsed(signature, expiresAtMs)

            const sessionExpiresAt = clock.now() + config.sessionTtlSeconds * 1000
            setSessionCookie(reply, sessionExpiresAt, config.sessionTtlSeconds)
            return { expiresAt: new Date(sessionExpiresAt).toISOString() }
        },
    )
}
