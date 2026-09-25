import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ProtectionEventLog } from '#infra/logging/protection-event-log.js'

const KEY = 'k'.repeat(32)
const NOW = new Date('2026-09-25T15:30:00.000Z')

function createLog(dir = mkdtempSync(join(tmpdir(), 'plog-'))) {
    return { dir, log: new ProtectionEventLog({ dir, key: KEY, now: () => NOW }) }
}

function readEvents(dir: string): Record<string, unknown>[] {
    const content = readFileSync(join(dir, 'protection-events-2026-09-25.jsonl'), 'utf8')
    return content
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line) as Record<string, unknown>)
}

describe('ProtectionEventLog', () => {
    it('writes one JSON event per line in a file per UTC day', () => {
        const { dir, log } = createLog()
        log.record({ type: 'rate_limit_blocked', accessKey: '203.0.113.9' })
        log.record({
            type: 'verification_failed',
            accessKey: '203.0.113.9',
            reason: 'replayed_challenge',
        })
        expect(readdirSync(dir)).toEqual(['protection-events-2026-09-25.jsonl'])
        const [blocked, failed] = readEvents(dir)
        expect(blocked).toEqual({
            occurredAt: '2026-09-25T15:30:00.000Z',
            type: 'rate_limit_blocked',
            accessId: expect.stringMatching(/^[0-9a-f]{16}$/),
        })
        expect(failed).toMatchObject({
            type: 'verification_failed',
            reason: 'replayed_challenge',
        })
    })

    it('never writes the network address', () => {
        const { dir, log } = createLog()
        log.record({ type: 'rate_limit_blocked', accessKey: '203.0.113.9' })
        log.record({ type: 'rate_limit_blocked', accessKey: '2001:db8:1:2::/64' })
        const content = readFileSync(join(dir, 'protection-events-2026-09-25.jsonl'), 'utf8')
        expect(content).not.toContain('203.0.113.9')
        expect(content).not.toContain('2001:db8')
    })

    it('gives the same access the same id and different accesses different ids', () => {
        const { log } = createLog()
        expect(log.accessId('203.0.113.9')).toBe(log.accessId('203.0.113.9'))
        expect(log.accessId('203.0.113.9')).not.toBe(log.accessId('203.0.113.10'))
    })

    it('does not throw when the log cannot be written', () => {
        const base = mkdtempSync(join(tmpdir(), 'plog-'))
        const blocker = join(base, 'not-a-dir')
        writeFileSync(blocker, 'file in the way')
        const errors: unknown[] = []
        const log = new ProtectionEventLog({
            dir: join(blocker, 'logs'),
            key: KEY,
            now: () => NOW,
            onError: (error) => errors.push(error),
        })
        expect(() => log.record({ type: 'rate_limit_blocked', accessKey: '1.2.3.4' })).not.toThrow()
        expect(errors).toHaveLength(1)
    })
})
