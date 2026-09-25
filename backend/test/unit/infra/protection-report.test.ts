import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildProtectionReport } from '#infra/logging/protection-report.js'

function line(event: Record<string, string>): string {
    return JSON.stringify(event)
}

describe('buildProtectionReport', () => {
    it('summarizes blocks, failures by reason and the most frequent accesses per day', () => {
        const dir = mkdtempSync(join(tmpdir(), 'plog-'))
        writeFileSync(
            join(dir, 'protection-events-2026-09-24.jsonl'),
            [
                line({
                    occurredAt: '2026-09-24T10:00:00.000Z',
                    type: 'rate_limit_blocked',
                    accessId: 'aaaaaaaaaaaaaaaa',
                }),
                line({
                    occurredAt: '2026-09-24T10:05:00.000Z',
                    type: 'rate_limit_blocked',
                    accessId: 'aaaaaaaaaaaaaaaa',
                }),
                line({
                    occurredAt: '2026-09-24T11:00:00.000Z',
                    type: 'verification_failed',
                    accessId: 'bbbbbbbbbbbbbbbb',
                    reason: 'invalid_solution',
                }),
            ].join('\n') + '\n',
        )
        writeFileSync(join(dir, 'protection-events-2026-09-25.jsonl'), '')

        const report = buildProtectionReport(dir)
        expect(report).toEqual([
            {
                day: '2026-09-24',
                blocks: 2,
                failures: { invalid_solution: 1, expired_challenge: 0, replayed_challenge: 0 },
                topAccessIds: [
                    { accessId: 'aaaaaaaaaaaaaaaa', events: 2 },
                    { accessId: 'bbbbbbbbbbbbbbbb', events: 1 },
                ],
            },
            {
                day: '2026-09-25',
                blocks: 0,
                failures: { invalid_solution: 0, expired_challenge: 0, replayed_challenge: 0 },
                topAccessIds: [],
            },
        ])
    })
})
