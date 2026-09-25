// Configuração da proteção contra bots (spec 003, research R7). Sem os três
// segredos válidos, o backend não sobe.

export class ProtectionConfigError extends Error {}

export interface ProtectionConfig {
    altchaHmacKey: string
    sessionSecret: string
    protectionLogKey: string
    sessionTtlSeconds: number
    rateLimitMax: number
    rateLimitWindowSeconds: number
    rateLimitBanSeconds: number
    altchaCost: number
    altchaCounterMax: number
    protectionLogRetentionDays: number
    protectionLogDir: string
}

type Env = Record<string, string | undefined>

const MIN_SECRET_LENGTH = 32

function readSecret(env: Env, name: string): string {
    const value = env[name]
    if (!value) {
        throw new ProtectionConfigError(`${name} is required.`)
    }
    if (value.length < MIN_SECRET_LENGTH) {
        throw new ProtectionConfigError(
            `${name} must have at least ${MIN_SECRET_LENGTH} characters.`,
        )
    }
    return value
}

function readPositiveInteger(env: Env, name: string, fallback: number): number {
    const raw = env[name]
    if (raw === undefined) {
        return fallback
    }
    if (!/^\d+$/.test(raw) || Number(raw) < 1) {
        throw new ProtectionConfigError(`${name} must be a positive integer, got "${raw}".`)
    }
    return Number(raw)
}

export function loadProtectionConfig(env: Env): ProtectionConfig {
    const altchaHmacKey = readSecret(env, 'ALTCHA_HMAC_KEY')
    const sessionSecret = readSecret(env, 'SESSION_SECRET')
    const protectionLogKey = readSecret(env, 'PROTECTION_LOG_KEY')
    if (new Set([altchaHmacKey, sessionSecret, protectionLogKey]).size !== 3) {
        throw new ProtectionConfigError(
            'ALTCHA_HMAC_KEY, SESSION_SECRET and PROTECTION_LOG_KEY must be different.',
        )
    }

    return {
        altchaHmacKey,
        sessionSecret,
        protectionLogKey,
        sessionTtlSeconds: readPositiveInteger(env, 'SESSION_TTL_SECONDS', 1800),
        rateLimitMax: readPositiveInteger(env, 'RATE_LIMIT_MAX', 120),
        rateLimitWindowSeconds: readPositiveInteger(env, 'RATE_LIMIT_WINDOW_SECONDS', 60),
        rateLimitBanSeconds: readPositiveInteger(env, 'RATE_LIMIT_BAN_SECONDS', 60),
        altchaCost: readPositiveInteger(env, 'ALTCHA_COST', 5000),
        altchaCounterMax: readPositiveInteger(env, 'ALTCHA_COUNTER_MAX', 1000),
        protectionLogRetentionDays: readPositiveInteger(env, 'PROTECTION_LOG_RETENTION_DAYS', 7),
        protectionLogDir: env['PROTECTION_LOG_DIR'] ?? '/var/lib/censo/protection-log',
    }
}
