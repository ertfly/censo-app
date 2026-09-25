import { describe, expect, it } from 'vitest'
import { ListStatesHandler } from '#application/queries/list-states/list-states.handler.js'
import type { StateSummary, StatesReader } from '#application/queries/list-states/states.reader.js'

const STATES: StateSummary[] = [
    { code: '12', abbreviation: 'AC', name: 'Acre' },
    { code: '27', abbreviation: 'AL', name: 'Alagoas' },
]

class FakeReader implements StatesReader {
    listAll(): Promise<StateSummary[]> {
        return Promise.resolve(STATES)
    }
}

describe('ListStatesHandler', () => {
    it('returns the states given by the reader', async () => {
        await expect(new ListStatesHandler(new FakeReader()).execute()).resolves.toEqual({
            items: STATES,
        })
    })
})
