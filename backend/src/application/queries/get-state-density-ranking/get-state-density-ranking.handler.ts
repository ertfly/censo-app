import type { GetStateDensityRankingParams, StateRanking } from '@censo/contracts'
import { StateCode } from '#domain/value-objects/state-code.vo.js'
import type { StateRankingReader } from './state-ranking.reader.js'

// Ranking dos municípios da UF por densidade (spec 002 FR-002, FR-018).
export class GetStateDensityRankingHandler {
    constructor(private readonly reader: StateRankingReader) {}

    async execute(query: GetStateDensityRankingParams): Promise<StateRanking> {
        return this.reader.findByState(StateCode.create(query.stateCode))
    }
}
