import { ApiError } from './request'
import type { QueryBlockReason } from './session'

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

// Explicação associada aos campos desabilitados pela proteção (spec 003 FR-006,
// FR-009); o aviso visível fica no topo da tela.
const BLOCKED_QUERY_EXPLANATIONS: Record<QueryBlockReason, string> = {
    verifying: 'A consulta fica disponível ao fim da verificação do navegador.',
    'verification-failed': 'A consulta depende da verificação do navegador, que não foi concluída.',
    'rate-limited': 'Aguarde o fim do bloqueio para consultar de novo.',
}

export function blockedQueryExplanation(reason: QueryBlockReason): string {
    return BLOCKED_QUERY_EXPLANATIONS[reason]
}
