import { InvalidStateCodeError } from '../errors/invalid-state-code.error.js'

// Códigos de UF do IBGE e siglas; a base traz só código e nome (research R7 da 001).
const ABBREVIATIONS = {
    '11': 'RO',
    '12': 'AC',
    '13': 'AM',
    '14': 'RR',
    '15': 'PA',
    '16': 'AP',
    '17': 'TO',
    '21': 'MA',
    '22': 'PI',
    '23': 'CE',
    '24': 'RN',
    '25': 'PB',
    '26': 'PE',
    '27': 'AL',
    '28': 'SE',
    '29': 'BA',
    '31': 'MG',
    '32': 'ES',
    '33': 'RJ',
    '35': 'SP',
    '41': 'PR',
    '42': 'SC',
    '43': 'RS',
    '50': 'MS',
    '51': 'MT',
    '52': 'GO',
    '53': 'DF',
} as const

type StateCodeValue = keyof typeof ABBREVIATIONS

function isStateCodeValue(value: string): value is StateCodeValue {
    return Object.hasOwn(ABBREVIATIONS, value)
}

export class StateCode {
    private constructor(readonly value: StateCodeValue) {
        Object.freeze(this)
    }

    static create(value: string): StateCode {
        if (!/^\d{2}$/.test(value) || !isStateCodeValue(value)) {
            throw new InvalidStateCodeError(value)
        }
        return new StateCode(value)
    }

    static all(): StateCode[] {
        return (Object.keys(ABBREVIATIONS) as StateCodeValue[]).map((value) => new StateCode(value))
    }

    get abbreviation(): string {
        return ABBREVIATIONS[this.value]
    }

    equals(other: StateCode): boolean {
        return this.value === other.value
    }
}
