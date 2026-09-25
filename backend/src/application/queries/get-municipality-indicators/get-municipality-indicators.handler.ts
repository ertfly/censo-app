import type { GetMunicipalityIndicatorsParams, MunicipalityIndicators } from '@censo/contracts'
import { MunicipalityNotFoundError } from '#domain/errors/municipality-not-found.error.js'
import { MunicipalityCode } from '#domain/value-objects/municipality-code.vo.js'
import type { MunicipalityIndicatorsReader } from './municipality-indicators.reader.js'

// Ficha do município (spec 001 FR-009, FR-018).
export class GetMunicipalityIndicatorsHandler {
    constructor(private readonly reader: MunicipalityIndicatorsReader) {}

    async execute(query: GetMunicipalityIndicatorsParams): Promise<MunicipalityIndicators> {
        const code = MunicipalityCode.create(query.municipalityCode)
        const indicators = await this.reader.findByCode(code)
        if (!indicators) {
            throw new MunicipalityNotFoundError(code.value)
        }
        return indicators
    }
}
