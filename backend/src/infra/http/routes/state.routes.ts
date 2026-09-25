import {
    ErrorResponse,
    GetStateDensityRankingParams,
    ListStatesResponse,
    StateRanking,
} from '@censo/contracts'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import type { GetStateDensityRankingHandler } from '#application/queries/get-state-density-ranking/get-state-density-ranking.handler.js'
import type { ListStatesHandler } from '#application/queries/list-states/list-states.handler.js'

export interface StateRoutesOptions {
    listStates: ListStatesHandler
    getStateDensityRanking: GetStateDensityRankingHandler
}

export const stateRoutes: FastifyPluginAsyncTypebox<StateRoutesOptions> = async (
    app,
    { listStates, getStateDensityRanking },
) => {
    app.get('/api/states', { schema: { response: { 200: ListStatesResponse } } }, () =>
        listStates.execute(),
    )

    app.get(
        '/api/states/:stateCode/density-ranking',
        {
            schema: {
                params: GetStateDensityRankingParams,
                response: { 200: StateRanking, 400: ErrorResponse },
            },
        },
        (request) => getStateDensityRanking.execute(request.params),
    )
}
