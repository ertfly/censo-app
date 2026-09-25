import { describe, expect, it } from 'vitest'
import { InvalidMunicipalityCodeError } from '#domain/errors/invalid-municipality-code.error.js'
import { MunicipalityCode } from '#domain/value-objects/municipality-code.vo.js'

describe('MunicipalityCode', () => {
    it('accepts 7 digits starting with a valid state code', () => {
        const code = MunicipalityCode.create('3550308')
        expect(code.value).toBe('3550308')
        expect(code.stateCode.abbreviation).toBe('SP')
    })

    it.each(['.', '', '355030', '35503080', 'abc1234', '355030a'])(
        'rejects the malformed value "%s"',
        (value) => {
            expect(() => MunicipalityCode.create(value)).toThrow(InvalidMunicipalityCodeError)
        },
    )

    it.each(['9999999', '1000001', '1800001'])(
        'rejects %s, whose state does not exist',
        (value) => {
            expect(() => MunicipalityCode.create(value)).toThrow(InvalidMunicipalityCodeError)
        },
    )

    it('compares by value and is immutable', () => {
        const code = MunicipalityCode.create('3550308')
        expect(code.equals(MunicipalityCode.create('3550308'))).toBe(true)
        expect(code.equals(MunicipalityCode.create('3304557'))).toBe(false)
        expect(Object.isFrozen(code)).toBe(true)
    })

    it('reports the API code', () => {
        expect(() => MunicipalityCode.create('x')).toThrow(
            expect.objectContaining({ code: 'INVALID_MUNICIPALITY_CODE', kind: 'invalid' }),
        )
    })
})
