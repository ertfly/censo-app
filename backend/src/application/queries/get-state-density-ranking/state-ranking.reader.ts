import type { StateRanking } from '@censo/contracts'
import type { StateCode } from '#domain/value-objects/state-code.vo.js'

export type { StateRanking }

// Porta de leitura do ranking da UF (ADR 0008). Toda UF válida tem municípios.
export interface StateRankingReader {
    findByState(code: StateCode): Promise<StateRanking>
}
