import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { deleteExpiredProtectionLogs } from '#infra/logging/protection-log-retention.js'

describe('deleteExpiredProtectionLogs', () => {
    it('keeps the last 7 days (today included, UTC) and deletes older files', () => {
        const dir = mkdtempSync(join(tmpdir(), 'plog-'))
        const files = [
            'protection-events-2026-09-17.jsonl',
            'protection-events-2026-09-18.jsonl',
            'protection-events-2026-09-19.jsonl',
            'protection-events-2026-09-25.jsonl',
            'other-file.txt',
        ]
        for (const file of files) {
            writeFileSync(join(dir, file), '')
        }
        const deleted = deleteExpiredProtectionLogs(dir, 7, new Date('2026-09-25T23:59:00.000Z'))
        expect(deleted.sort()).toEqual([
            'protection-events-2026-09-17.jsonl',
            'protection-events-2026-09-18.jsonl',
        ])
        expect(readdirSync(dir).sort()).toEqual([
            'other-file.txt',
            'protection-events-2026-09-19.jsonl',
            'protection-events-2026-09-25.jsonl',
        ])
    })

    it('does nothing when the directory does not exist', () => {
        expect(deleteExpiredProtectionLogs('/nonexistent/dir', 7, new Date())).toEqual([])
    })
})
