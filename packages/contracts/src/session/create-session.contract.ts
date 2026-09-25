import { type Static, Type } from 'typebox'

// Troca a solução do desafio por uma sessão de 30 minutos (spec 003).
export const CreateSessionBody = Type.Object({
    // Base64 de { challenge, solution } produzido pelo widget ALTCHA.
    payload: Type.String({ minLength: 1, maxLength: 8192 }),
})
export type CreateSessionBody = Static<typeof CreateSessionBody>

export const CreateSessionResponse = Type.Object({
    expiresAt: Type.String({ format: 'date-time' }),
})
export type CreateSessionResponse = Static<typeof CreateSessionResponse>
