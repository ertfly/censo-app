import { DomainError } from './domain-error.js'

export class InvalidStateCodeError extends DomainError {
    readonly code = 'INVALID_STATE_CODE'
    readonly kind = 'invalid'

    constructor(value: string) {
        super(`Invalid state code: "${value}"`)
    }
}
