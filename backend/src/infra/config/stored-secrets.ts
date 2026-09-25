import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ProtectionConfigError } from './protection-config.js'

// Segredos da proteção (ADR 0024): a variável de ambiente vale quando definida;
// sem ela, usa o valor guardado no volume ou gera um na primeira subida.

export const SECRET_NAMES = ['ALTCHA_HMAC_KEY', 'SESSION_SECRET', 'PROTECTION_LOG_KEY'] as const

type Env = Record<string, string | undefined>

function isMissingFile(error: unknown): boolean {
    return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

function readOrCreate(path: string): string {
    try {
        return readFileSync(path, 'utf8').trim()
    } catch (error) {
        if (!isMissingFile(error)) {
            throw error
        }
    }
    const secret = randomBytes(32).toString('hex')
    // "wx": não sobrescreve um arquivo criado entre a leitura e a escrita.
    writeFileSync(path, secret, { mode: 0o600, flag: 'wx' })
    return secret
}

export function withStoredSecrets(env: Env, dir: string): Env {
    const result: Env = { ...env }
    for (const name of SECRET_NAMES) {
        if (result[name]) {
            continue
        }
        try {
            result[name] = readOrCreate(join(dir, name))
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error)
            throw new ProtectionConfigError(
                `${name} is not set and could not be stored in ${dir}: ${reason}`,
            )
        }
    }
    return result
}
