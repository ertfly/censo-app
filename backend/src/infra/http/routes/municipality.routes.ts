import {
    ErrorResponse,
    SearchMunicipalitiesQuery,
    SearchMunicipalitiesResponse,
} from '@censo/contracts'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import type { SearchMunicipalitiesHandler } from '#application/queries/search-municipalities/search-municipalities.handler.js'

export interface MunicipalityRoutesOptions {
    searchMunicipalities: SearchMunicipalitiesHandler
}

export const municipalityRoutes: FastifyPluginAsyncTypebox<MunicipalityRoutesOptions> = async (
    app,
    { searchMunicipalities },
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
}
