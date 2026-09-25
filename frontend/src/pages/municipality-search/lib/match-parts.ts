// Divide o nome em trechos para destacar o que foi digitado (design.md,
// "Sugerindo"). Compara sem acento e sem diferença de maiúsculas, no início de
// uma palavra, como a busca (spec 001 FR-003, FR-004).

export interface MatchPart {
    text: string
    matched: boolean
}

const WORD_SEPARATOR = /[\s\-'’]/u

function fold(char: string): string {
    return char
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
}

export function matchParts(name: string, term: string): MatchPart[] {
    const chars = [...name]
    const folded = chars.map(fold)
    const needle = [...term.trim().replace(/\s+/gu, ' ')].map(fold).join('')
    // Letras que não viram exatamente um caractere impedem o mapeamento: sem destaque.
    if (!needle || folded.some((char) => char.length !== 1)) {
        return [{ text: name, matched: false }]
    }

    const haystack = folded.join('')
    for (let start = 0; start < chars.length; start += 1) {
        const isWordStart = start === 0 || WORD_SEPARATOR.test(chars[start - 1] ?? '')
        if (isWordStart && haystack.startsWith(needle, start)) {
            const end = start + needle.length
            return [
                { text: chars.slice(0, start).join(''), matched: false },
                { text: chars.slice(start, end).join(''), matched: true },
                { text: chars.slice(end).join(''), matched: false },
            ].filter((part) => part.text !== '')
        }
    }
    return [{ text: name, matched: false }]
}
