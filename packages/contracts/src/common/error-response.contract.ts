import { type Static, Type } from 'typebox'

// Corpo de toda resposta de erro da API. A mensagem ao visitante é do frontend.
export const ErrorResponse = Type.Object({
    code: Type.String(),
    // Só no bloqueio por excesso de consultas (spec 003).
    retryAfterSeconds: Type.Optional(Type.Integer({ minimum: 1 })),
})
export type ErrorResponse = Static<typeof ErrorResponse>
