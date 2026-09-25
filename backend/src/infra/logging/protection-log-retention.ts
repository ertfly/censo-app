import { readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const FILE_PATTERN = /^protection-events-(\d{4}-\d{2}-\d{2})\.jsonl$/
const ONE_HOUR_MS = 60 * 60 * 1000
const ONE_DAY_MS = 24 * ONE_HOUR_MS

// Mantém os últimos `retentionDays` dias, contando hoje, em UTC (spec 003 FR-017).
export function deleteExpiredProtectionLogs(
    dir: string,
    retentionDays: number,
    now: Date,
): string[] {
    let files: string[]
    try {
        files = readdirSync(dir)
    } catch {
        return []
    }
    const today = Date.parse(now.toISOString().slice(0, 10))
    const oldestKept = today - (retentionDays - 1) * ONE_DAY_MS

    const deleted: string[] = []
    for (const file of files) {
        const day = FILE_PATTERN.exec(file)?.[1]
        if (day !== undefined && Date.parse(day) < oldestKept) {
            rmSync(join(dir, file))
            deleted.push(file)
        }
    }
    return deleted
}

// Descarte na inicialização e a cada hora (ADR 0019).
export function startProtectionLogRetention(dir: string, retentionDays: number): () => void {
    const run = () => deleteExpiredProtectionLogs(dir, retentionDays, new Date())
    run()
    const timer = setInterval(run, ONE_HOUR_MS)
    timer.unref()
    return () => clearInterval(timer)
}
