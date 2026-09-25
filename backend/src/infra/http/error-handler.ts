import type { FastifyInstance } from 'fastify'
import { DomainError } from '#domain/errors/domain-error.js'

declare module 'fastify' {
    interface FastifyContextConfig {
        // Código devolvido quando a entrada não passa no schema do contrato.
        validationErrorCode?: string
    }
}

const STATUS_BY_KIND = {
    invalid: 400,
    not_found: 404,
} as const

export function registerErrorHandler(app: FastifyInstance): void {
    app.setErrorHandler((error, request, reply) => {
        if (error instanceof DomainError) {
            return reply.status(STATUS_BY_KIND[error.kind]).send({ code: error.code })
        }
        if (typeof error === 'object' && error !== null && 'validation' in error) {
            const code = request.routeOptions.config.validationErrorCode ?? 'INVALID_REQUEST'
            return reply.status(400).send({ code })
        }
        request.log.error(error)
        return reply.status(500).send({ code: 'INTERNAL_ERROR' })
    })

    app.setNotFoundHandler((_request, reply) => reply.status(404).send({ code: 'NOT_FOUND' }))
}
