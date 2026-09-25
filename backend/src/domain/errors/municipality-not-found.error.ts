import { DomainError } from './domain-error.js'

export class MunicipalityNotFoundError extends DomainError {
    readonly code = 'MUNICIPALITY_NOT_FOUND'
    readonly kind = 'not_found'

    constructor(value: string) {
        super(`Municipality not found: "${value}"`)
    }
}
