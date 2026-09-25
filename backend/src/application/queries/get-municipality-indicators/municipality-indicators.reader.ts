import type { MunicipalityIndicators } from '@censo/contracts'
import type { MunicipalityCode } from '#domain/value-objects/municipality-code.vo.js'

export type { MunicipalityIndicators }

// Porta de leitura dos indicadores do município (ADR 0008); null quando o
// código é válido mas não há município.
export interface MunicipalityIndicatorsReader {
    findByCode(code: MunicipalityCode): Promise<MunicipalityIndicators | null>
}
