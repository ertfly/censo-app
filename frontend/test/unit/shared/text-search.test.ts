import { describe, expect, it } from 'vitest'
import { matchesWordStart, normalizeText } from '@/shared/lib/text-search'
import cases from '../../../../test/shared/text-search.cases.json'

// Mesma tabela de casos do SearchTerm do backend (research R4 da 002).
interface TextSearchCase {
    term: string
    matches: string[]
}

const CASES: TextSearchCase[] = cases

const NAMES = ['São Paulo', 'Paulo Afonso', 'Bom Jesus', "Pau D'Arco", 'Santo Antônio']

describe('normalizeText', () => {
    it('removes accents, lowercases and collapses spaces', () => {
        expect(normalizeText('  SÃO   Paulo ')).toBe('sao paulo')
        expect(normalizeText("Pau D'Arco")).toBe("pau d'arco")
    })
})

describe('matchesWordStart', () => {
    it.each(CASES)('finds exactly the shared matches for "$term"', ({ term, matches }) => {
        expect(NAMES.filter((name) => matchesWordStart(name, term))).toEqual(matches)
    })

    it('treats space, hyphen and apostrophe as word separators', () => {
        expect(matchesWordStart('Embu-Guaçu', 'guacu')).toBe(true)
        expect(matchesWordStart("Olhos-d'Água", 'agua')).toBe(true)
        expect(matchesWordStart('Juiz de Fora', 'fora')).toBe(true)
    })

    it('matches from the first character and accepts an empty term', () => {
        expect(matchesWordStart('Juiz de Fora', 'j')).toBe(true)
        expect(matchesWordStart('Juiz de Fora', '  ')).toBe(true)
        expect(matchesWordStart('Juiz de Fora', 'uiz')).toBe(false)
    })
})
