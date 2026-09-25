import { type Static, Type } from 'typebox'

// Desafio no formato v2 do ALTCHA (spec 003, contracts/api.md). Os parâmetros
// aceitam campos adicionais: a serialização do Fastify descartaria campos fora do
// schema, e o navegador precisa do desafio exatamente como foi assinado.
export const GetChallengeResponse = Type.Object({
    parameters: Type.Object(
        {
            algorithm: Type.String(),
            nonce: Type.String(),
            salt: Type.String(),
            cost: Type.Number(),
            keyLength: Type.Number(),
            keyPrefix: Type.String(),
            keySignature: Type.Optional(Type.String()),
            expiresAt: Type.Optional(Type.Number()),
        },
        { additionalProperties: true },
    ),
    signature: Type.Optional(Type.String()),
})
export type GetChallengeResponse = Static<typeof GetChallengeResponse>
