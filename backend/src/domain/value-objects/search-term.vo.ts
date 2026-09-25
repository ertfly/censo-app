import { InvalidSearchTermError } from '../errors/invalid-search-term.error.js'

const MIN_LENGTH = 2
const MAX_LENGTH = 60
// Espaço, hífen e apóstrofo separam palavras (spec 001 FR-004).
const WORD_SEPARATOR = /[\s\-'’]/u

export function normalizeText(text: string): string {
    return text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
}

export function wordStarts(normalized: string): number[] {
    const starts = [0]
    for (let index = 1; index < normalized.length; index += 1) {
        if (WORD_SEPARATOR.test(normalized[index - 1] ?? '')) {
            starts.push(index)
        }
    }
    return starts
}

// Termo de busca de município: sem acento, sem diferença de maiúsculas, casando
// no início de qualquer palavra do nome (spec 001 FR-002 a FR-004).
export class SearchTerm {
    readonly normalized: string

    private constructor(readonly value: string) {
        this.normalized = normalizeText(value)
        Object.freeze(this)
    }

    static create(raw: string): SearchTerm {
        const value = raw.trim().replace(/\s+/gu, ' ')
        if (value.length < MIN_LENGTH || value.length > MAX_LENGTH) {
            throw new InvalidSearchTermError(raw)
        }
        return new SearchTerm(value)
    }

    matchesWordStartOf(name: string): boolean {
        const normalizedName = normalizeText(name)
        return wordStarts(normalizedName).some((start) =>
            normalizedName.startsWith(this.normalized, start),
        )
    }

    startsNameOf(name: string): boolean {
        return normalizeText(name).startsWith(this.normalized)
    }

    equals(other: SearchTerm): boolean {
        return this.normalized === other.normalized
    }
}
