import { type Static, Type } from 'typebox'

// Corpo de toda resposta de erro da API. A mensagem ao visitante é do frontend.
export const ErrorResponse = Type.Object({
    code: Type.String(),
})
export type ErrorResponse = Static<typeof ErrorResponse>
