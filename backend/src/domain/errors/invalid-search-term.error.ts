import { DomainError } from './domain-error.js'

export class InvalidSearchTermError extends DomainError {
    readonly code = 'INVALID_SEARCH_TERM'
    readonly kind = 'invalid'

    constructor(value: string) {
        super(`Invalid search term: "${value}"`)
    }
}
