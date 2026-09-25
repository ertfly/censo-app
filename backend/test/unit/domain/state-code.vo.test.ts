import { describe, expect, it } from 'vitest'
import { InvalidStateCodeError } from '#domain/errors/invalid-state-code.error.js'
import { StateCode } from '#domain/value-objects/state-code.vo.js'

const EXPECTED: Record<string, string> = {
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
}

describe('StateCode', () => {
    it.each(Object.entries(EXPECTED))('maps %s to %s', (code, abbreviation) => {
        const stateCode = StateCode.create(code)
        expect(stateCode.value).toBe(code)
        expect(stateCode.abbreviation).toBe(abbreviation)
    })

    it('has exactly the 27 states', () => {
        expect(StateCode.all().map((stateCode) => stateCode.value)).toEqual(Object.keys(EXPECTED))
    })

    it.each(['3', '355', 'SP', '', ' 35', '3a'])('rejects the malformed value "%s"', (value) => {
        expect(() => StateCode.create(value)).toThrow(InvalidStateCodeError)
    })

    it.each(['00', '10', '18', '99'])('rejects the code %s, which is not a state', (value) => {
        expect(() => StateCode.create(value)).toThrow(InvalidStateCodeError)
    })

    it('compares by value', () => {
        expect(StateCode.create('35').equals(StateCode.create('35'))).toBe(true)
        expect(StateCode.create('35').equals(StateCode.create('33'))).toBe(false)
    })

    it('is immutable', () => {
        expect(Object.isFrozen(StateCode.create('35'))).toBe(true)
    })

    it('exposes the error code', () => {
        try {
            StateCode.create('99')
        } catch (error) {
            expect(error).toBeInstanceOf(InvalidStateCodeError)
            expect((error as InvalidStateCodeError).code).toBe('INVALID_STATE_CODE')
            expect((error as InvalidStateCodeError).kind).toBe('invalid')
        }
    })
})
