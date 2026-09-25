// Busca por nome igual à do backend (SearchTerm; research R4 da 002): sem
// acento, sem diferença de maiúsculas, no início de qualquer palavra, com
// espaço, hífen e apóstrofo como separadores.

const WORD_SEPARATOR = /[\s\-'’]/u

export function normalizeText(text: string): string {
    return text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/gu, ' ')
}

// Termo vazio encontra todos os nomes.
export function matchesWordStart(name: string, term: string): boolean {
    const needle = normalizeText(term)
    if (needle === '') {
        return true
    }
    const haystack = normalizeText(name)
    for (let index = 0; index < haystack.length; index += 1) {
        const isWordStart = index === 0 || WORD_SEPARATOR.test(haystack[index - 1] ?? '')
        if (isWordStart && haystack.startsWith(needle, index)) {
            return true
        }
    }
    return false
}
