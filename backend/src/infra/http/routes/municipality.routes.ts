import {
    ErrorResponse,
    GetMunicipalityIndicatorsParams,
    MunicipalityIndicators,
    SearchMunicipalitiesQuery,
    SearchMunicipalitiesResponse,
} from '@censo/contracts'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import type { GetMunicipalityIndicatorsHandler } from '#application/queries/get-municipality-indicators/get-municipality-indicators.handler.js'
import type { SearchMunicipalitiesHandler } from '#application/queries/search-municipalities/search-municipalities.handler.js'

export interface MunicipalityRoutesOptions {
    searchMunicipalities: SearchMunicipalitiesHandler
    getMunicipalityIndicators: GetMunicipalityIndicatorsHandler
}

export const municipalityRoutes: FastifyPluginAsyncTypebox<MunicipalityRoutesOptions> = async (
    app,
    { searchMunicipalities, getMunicipalityIndicators },
) => {
    app.get(
        '/api/municipalities/suggestions',
        {
            schema: {
                querystring: SearchMunicipalitiesQuery,
                response: { 200: SearchMunicipalitiesResponse, 400: ErrorResponse },
            },
            config: { validationErrorCode: 'INVALID_SEARCH_TERM' },
        },
        (request) => searchMunicipalities.execute(request.query),
    )

    app.get(
        '/api/municipalities/:municipalityCode',
        {
            schema: {
                params: GetMunicipalityIndicatorsParams,
                response: { 200: MunicipalityIndicators, 400: ErrorResponse, 404: ErrorResponse },
            },
        },
        (request) => getMunicipalityIndicators.execute(request.params),
    )
}
