import { describe, expect, it } from 'vitest'
import { loadProtectionConfig, ProtectionConfigError } from '#infra/config/protection-config.js'

const SECRETS = {
    ALTCHA_HMAC_KEY: 'a'.repeat(32),
    SESSION_SECRET: 'b'.repeat(32),
    PROTECTION_LOG_KEY: 'c'.repeat(32),
}

describe('loadProtectionConfig', () => {
    it('uses the spec defaults when only the secrets are set', () => {
        expect(loadProtectionConfig({ ...SECRETS })).toEqual({
            altchaHmacKey: SECRETS.ALTCHA_HMAC_KEY,
            sessionSecret: SECRETS.SESSION_SECRET,
            protectionLogKey: SECRETS.PROTECTION_LOG_KEY,
            sessionTtlSeconds: 1800,
            rateLimitMax: 120,
            rateLimitWindowSeconds: 60,
            rateLimitBanSeconds: 60,
            altchaMaxNumber: 50000,
            protectionLogRetentionDays: 7,
            protectionLogDir: '/var/lib/censo/protection-log',
        })
    })

    it.each(['ALTCHA_HMAC_KEY', 'SESSION_SECRET', 'PROTECTION_LOG_KEY'] as const)(
        'refuses to start without %s',
        (name) => {
            const env: Record<string, string | undefined> = { ...SECRETS }
            delete env[name]
            expect(() => loadProtectionConfig(env)).toThrow(ProtectionConfigError)
            expect(() => loadProtectionConfig(env)).toThrow(name)
        },
    )

    it('refuses secrets shorter than 32 characters', () => {
        expect(() => loadProtectionConfig({ ...SECRETS, SESSION_SECRET: 'short' })).toThrow(
            /at least 32/,
        )
    })

    it('refuses repeated secrets', () => {
        expect(() =>
            loadProtectionConfig({ ...SECRETS, PROTECTION_LOG_KEY: SECRETS.SESSION_SECRET }),
        ).toThrow(/different/)
    })

    it('reads the numeric values from the environment', () => {
        const config = loadProtectionConfig({
            ...SECRETS,
            SESSION_TTL_SECONDS: '60',
            RATE_LIMIT_MAX: '100000',
            ALTCHA_MAX_NUMBER: '1000',
        })
        expect(config.sessionTtlSeconds).toBe(60)
        expect(config.rateLimitMax).toBe(100000)
        expect(config.altchaMaxNumber).toBe(1000)
    })

    it.each(['0', '-5', 'abc', '1.5', ''])('refuses the invalid number "%s"', (value) => {
        expect(() => loadProtectionConfig({ ...SECRETS, RATE_LIMIT_MAX: value })).toThrow(
            /RATE_LIMIT_MAX/,
        )
    })
})
