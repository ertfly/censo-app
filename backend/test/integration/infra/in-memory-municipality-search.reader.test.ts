import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { SearchTerm } from '#domain/value-objects/search-term.vo.js'
import { InMemoryMunicipalitySearchReader } from '#infra/database/readers/in-memory-municipality-search.reader.js'
import { createTestDatabase } from '../../helpers/create-test-database.js'

const db = await createTestDatabase()
let reader: InMemoryMunicipalitySearchReader

beforeAll(async () => {
    reader = await InMemoryMunicipalitySearchReader.load(db)
})

afterAll(async () => {
    await db.destroy()
})

async function names(term: string, limit = 10): Promise<string[]> {
    const items = await reader.search(SearchTerm.create(term), limit)
    return items.map((item) => `${item.name}/${item.stateAbbreviation}`)
}

describe('InMemoryMunicipalitySearchReader', () => {
    it('finds by the start of any word, ignoring accents and case', async () => {
        expect(await names('SAO PAU')).toEqual(['São Paulo/SP'])
        expect(await names('paulo')).toEqual(['Paulo Afonso/BA', 'São Paulo/SP'])
        expect(await names('aulo')).toEqual([])
    })

    it('treats hyphen and apostrophe as word separators', async () => {
        expect(await names('arco')).toEqual(["Pau D'Arco/PA", "Pau D'Arco/TO"])
    })

    it('orders homonyms by state abbreviation', async () => {
        expect(await names('bom jesus')).toEqual(['Bom Jesus/PB', 'Bom Jesus/PI'])
    })

    it('never suggests the record without a name', async () => {
        const all = await names('po', 50)
        expect(all).not.toContain('/RS')
        expect(all.every((name) => !name.startsWith('/'))).toBe(true)
    })

    it('limits the number of suggestions', async () => {
        expect(await reader.search(SearchTerm.create('pa'), 2)).toHaveLength(2)
    })

    it('returns the contract fields', async () => {
        expect(await reader.search(SearchTerm.create('brasilia'), 10)).toEqual([
            { code: '5300108', name: 'Brasília', stateCode: '53', stateAbbreviation: 'DF' },
        ])
    })
})

describe('ordering rules', () => {
    it('puts names starting with the term before the others, then pt-BR order', async () => {
        const order = await InMemoryMunicipalitySearchReader.fromRows([
            { cd_mun: '2900002', nm_mun: 'Aguaí', cd_uf: '29' },
            { cd_mun: '2900003', nm_mun: 'Água Boa', cd_uf: '29' },
            { cd_mun: '2900004', nm_mun: 'Santo Antônio da Água', cd_uf: '29' },
        ]).search(SearchTerm.create('agua'), 10)
        expect(order.map((item) => item.name)).toEqual([
            'Água Boa',
            'Aguaí',
            'Santo Antônio da Água',
        ])
    })
})
