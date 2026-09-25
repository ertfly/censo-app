import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ProtectionConfigError } from '#infra/config/protection-config.js'
import { SECRET_NAMES, withStoredSecrets } from '#infra/config/stored-secrets.js'

// ADR 0024: segredos da variável de ambiente, do volume ou gerados na primeira subida.

let dir: string

beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'censo-secrets-'))
})

afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
})

describe('withStoredSecrets', () => {
    it('generates and stores the missing secrets on the first start', () => {
        const env = withStoredSecrets({}, dir)
        for (const name of SECRET_NAMES) {
            expect(env[name]).toMatch(/^[0-9a-f]{64}$/)
            expect(readFileSync(join(dir, name), 'utf8')).toBe(env[name])
            expect(statSync(join(dir, name)).mode & 0o777).toBe(0o600)
        }
        expect(new Set(SECRET_NAMES.map((name) => env[name])).size).toBe(3)
    })

    it('reuses the stored secrets on the next starts', () => {
        const first = withStoredSecrets({}, dir)
        const second = withStoredSecrets({}, dir)
        for (const name of SECRET_NAMES) {
            expect(second[name]).toBe(first[name])
        }
    })

    it('prefers the environment variable and does not store it', () => {
        const env = withStoredSecrets({ SESSION_SECRET: 'x'.repeat(40) }, dir)
        expect(env['SESSION_SECRET']).toBe('x'.repeat(40))
        expect(() => statSync(join(dir, 'SESSION_SECRET'))).toThrow()
    })

    it('ignores surrounding whitespace in a stored secret', () => {
        writeFileSync(join(dir, 'ALTCHA_HMAC_KEY'), `${'k'.repeat(40)}\n`)
        expect(withStoredSecrets({}, dir)['ALTCHA_HMAC_KEY']).toBe('k'.repeat(40))
    })

    it('keeps the other variables', () => {
        expect(withStoredSecrets({ RATE_LIMIT_MAX: '10' }, dir)['RATE_LIMIT_MAX']).toBe('10')
    })

    it('explains when the secrets directory cannot be used', () => {
        expect(() => withStoredSecrets({}, join(dir, 'missing', 'nested'))).toThrow(
            ProtectionConfigError,
        )
    })
})
