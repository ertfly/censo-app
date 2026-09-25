import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from 'typebox'

export const healthRoutes: FastifyPluginAsyncTypebox = async (app) => {
    app.get(
        '/api/health',
        { schema: { response: { 200: Type.Object({ status: Type.Literal('ok') }) } } },
        () => ({ status: 'ok' as const }),
    )
}
