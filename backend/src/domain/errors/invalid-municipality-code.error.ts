import { DomainError } from './domain-error.js'

export class InvalidMunicipalityCodeError extends DomainError {
    readonly code = 'INVALID_MUNICIPALITY_CODE'
    readonly kind = 'invalid'

    constructor(value: string) {
        super(`Invalid municipality code: "${value}"`)
    }
}
