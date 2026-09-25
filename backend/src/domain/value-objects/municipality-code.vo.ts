import { InvalidMunicipalityCodeError } from '../errors/invalid-municipality-code.error.js'
import { InvalidStateCodeError } from '../errors/invalid-state-code.error.js'
import { StateCode } from './state-code.vo.js'

// Código IBGE do município: 7 dígitos, os 2 primeiros formam uma UF válida.
export class MunicipalityCode {
    private constructor(
        readonly value: string,
        readonly stateCode: StateCode,
    ) {
        Object.freeze(this)
    }

    static create(value: string): MunicipalityCode {
        if (!/^\d{7}$/.test(value)) {
            throw new InvalidMunicipalityCodeError(value)
        }
        try {
            return new MunicipalityCode(value, StateCode.create(value.slice(0, 2)))
        } catch (error) {
            if (error instanceof InvalidStateCodeError) {
                throw new InvalidMunicipalityCodeError(value)
            }
            throw error
        }
    }

    equals(other: MunicipalityCode): boolean {
        return this.value === other.value
    }
}
