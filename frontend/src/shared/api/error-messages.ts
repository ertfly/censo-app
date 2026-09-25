import { ApiError } from './request'

// Mensagens em pt-BR para os códigos da API (contracts/api.md das features).
const GENERIC_MESSAGE = 'Não foi possível carregar os dados.'
const INVALID_MUNICIPALITY_ADDRESS =
    'Este endereço não corresponde a nenhum município. Busque pelo nome.'

const MESSAGES: Record<string, string> = {
    INVALID_SEARCH_TERM: 'Digite pelo menos 2 letras.',
    INVALID_MUNICIPALITY_CODE: INVALID_MUNICIPALITY_ADDRESS,
    MUNICIPALITY_NOT_FOUND: INVALID_MUNICIPALITY_ADDRESS,
}

export function errorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        return MESSAGES[error.code] ?? GENERIC_MESSAGE
    }
    return GENERIC_MESSAGE
}
