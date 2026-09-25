import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { InvalidSearchTermError } from '#domain/errors/invalid-search-term.error.js'
import { SearchTerm } from '#domain/value-objects/search-term.vo.js'

interface TextSearchCase {
    term: string
    matches: string[]
}

const CASES = JSON.parse(
    readFileSync(
        new URL('../../../../test/shared/text-search.cases.json', import.meta.url),
        'utf8',
    ),
) as TextSearchCase[]

describe('SearchTerm', () => {
    it('trims and collapses spaces', () => {
        expect(SearchTerm.create('  sao    paulo ').value).toBe('sao paulo')
    })

    it('normalizes without accents and in lowercase', () => {
        expect(SearchTerm.create('SÃO Paulo').normalized).toBe('sao paulo')
        expect(SearchTerm.create("Pau D'Arco").normalized).toBe("pau d'arco")
    })

    it.each(['', ' ', 'a', ' a ', 'x'.repeat(61)])('rejects "%s"', (value) => {
        expect(() => SearchTerm.create(value)).toThrow(InvalidSearchTermError)
    })

    it('accepts 2 and 60 characters', () => {
        expect(SearchTerm.create('ab').value).toBe('ab')
        expect(SearchTerm.create('x'.repeat(60)).value).toHaveLength(60)
    })

    it.each(CASES)(
        'matches the shared case "$term" at the start of a word',
        ({ term, matches }) => {
            const searchTerm = SearchTerm.create(term)
            for (const name of matches) {
                expect(searchTerm.matchesWordStartOf(name)).toBe(true)
            }
        },
    )

    it('does not match in the middle of a word', () => {
        expect(SearchTerm.create('aulo').matchesWordStartOf('São Paulo')).toBe(false)
        expect(SearchTerm.create('arco').matchesWordStartOf("Pau D'Arco")).toBe(true)
    })

    it('tells whether the name starts with the term', () => {
        expect(SearchTerm.create('sao').startsNameOf('São Paulo')).toBe(true)
        expect(SearchTerm.create('paulo').startsNameOf('São Paulo')).toBe(false)
    })
})
