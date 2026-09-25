import { createHmac } from 'node:crypto'
import { appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

// Registros de proteção sem endereço de rede (ADR 0019, spec 003 FR-016 a FR-020).

export type ProtectionEvent =
    | { type: 'rate_limit_blocked'; accessKey: string }
    | {
          type: 'verification_failed'
          accessKey: string
          reason: 'invalid_solution' | 'expired_challenge' | 'replayed_challenge'
      }

export interface ProtectionEventLogOptions {
    dir: string
    // PROTECTION_LOG_KEY: sem ela, o identificador não permite recuperar o endereço.
    key: string
    now?: () => Date
    onError?: (error: unknown) => void
}

export function protectionLogFileName(date: Date): string {
    return `protection-events-${date.toISOString().slice(0, 10)}.jsonl`
}

export class ProtectionEventLog {
    private readonly now: () => Date

    constructor(private readonly options: ProtectionEventLogOptions) {
        this.now = options.now ?? (() => new Date())
    }

    accessId(accessKey: string): string {
        return createHmac('sha256', this.options.key).update(accessKey).digest('hex').slice(0, 16)
    }

    // Uma falha de gravação não interrompe a verificação nem o limite (FR-020).
    record(event: ProtectionEvent): void {
        const occurredAt = this.now()
        const entry = {
            occurredAt: occurredAt.toISOString(),
            type: event.type,
            accessId: this.accessId(event.accessKey),
            ...(event.type === 'verification_failed' ? { reason: event.reason } : {}),
        }
        try {
            mkdirSync(this.options.dir, { recursive: true })
            appendFileSync(
                join(this.options.dir, protectionLogFileName(occurredAt)),
                `${JSON.stringify(entry)}\n`,
            )
        } catch (error) {
            this.options.onError?.(error)
        }
    }
}
