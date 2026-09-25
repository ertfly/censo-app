import { describe, expect, it } from 'vitest'
import { UsedChallengeStore } from '#infra/http/protection/challenge-store.js'

describe('UsedChallengeStore', () => {
    it('accepts a signature once and refuses it until it expires', () => {
        let now = 1_000
        const store = new UsedChallengeStore({ maxEntries: 10, now: () => now })
        expect(store.markUsed('sig-a', 5_000)).toBe(true)
        expect(store.markUsed('sig-a', 5_000)).toBe(false)
        now = 5_001
        expect(store.markUsed('sig-a', 9_000)).toBe(true)
    })

    it('reports whether a signature was used', () => {
        const store = new UsedChallengeStore({ maxEntries: 10, now: () => 0 })
        expect(store.isUsed('sig-b')).toBe(false)
        store.markUsed('sig-b', 1_000)
        expect(store.isUsed('sig-b')).toBe(true)
    })

    it('drops expired entries', () => {
        let now = 0
        const store = new UsedChallengeStore({ maxEntries: 10, now: () => now })
        store.markUsed('sig-c', 100)
        now = 101
        expect(store.isUsed('sig-c')).toBe(false)
        expect(store.size).toBe(0)
    })

    it('respects the size limit, dropping the oldest entries', () => {
        const store = new UsedChallengeStore({ maxEntries: 2, now: () => 0 })
        store.markUsed('one', 1_000)
        store.markUsed('two', 1_000)
        store.markUsed('three', 1_000)
        expect(store.size).toBe(2)
        expect(store.isUsed('one')).toBe(false)
        expect(store.isUsed('three')).toBe(true)
    })
})
