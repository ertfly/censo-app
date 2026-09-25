import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Resumo dos registros de proteção para o responsável (spec 003 FR-018).

const FILE_PATTERN = /^protection-events-(\d{4}-\d{2}-\d{2})\.jsonl$/
const TOP_ACCESS_IDS = 10

interface StoredEvent {
    type: 'rate_limit_blocked' | 'verification_failed'
    accessId: string
    reason?: 'invalid_solution' | 'expired_challenge' | 'replayed_challenge'
}

export interface DailyProtectionReport {
    day: string
    blocks: number
    failures: { invalid_solution: number; expired_challenge: number; replayed_challenge: number }
    topAccessIds: { accessId: string; events: number }[]
}

export function buildProtectionReport(dir: string): DailyProtectionReport[] {
    const days = readdirSync(dir)
        .map((file) => ({ file, day: FILE_PATTERN.exec(file)?.[1] }))
        .filter((entry): entry is { file: string; day: string } => entry.day !== undefined)
        .sort((a, b) => a.day.localeCompare(b.day))

    return days.map(({ file, day }) => {
        const events = readFileSync(join(dir, file), 'utf8')
            .split('\n')
            .filter((line) => line.trim() !== '')
            .map((line) => JSON.parse(line) as StoredEvent)

        const failures = { invalid_solution: 0, expired_challenge: 0, replayed_challenge: 0 }
        const byAccess = new Map<string, number>()
        let blocks = 0
        for (const event of events) {
            if (event.type === 'rate_limit_blocked') {
                blocks += 1
            } else if (event.reason) {
                failures[event.reason] += 1
            }
            byAccess.set(event.accessId, (byAccess.get(event.accessId) ?? 0) + 1)
        }

        const topAccessIds = [...byAccess.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, TOP_ACCESS_IDS)
            .map(([accessId, count]) => ({ accessId, events: count }))

        return { day, blocks, failures, topAccessIds }
    })
}
