// Erro de domínio: código em inglês para a API e tipo que a infra traduz para HTTP.
// O domínio não conhece status HTTP (ADR 0008).
export type DomainErrorKind = 'invalid' | 'not_found'

export abstract class DomainError extends Error {
    abstract readonly code: string
    abstract readonly kind: DomainErrorKind
}
