import type { Writable } from 'node:stream'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import Fastify, { type FastifyRequest } from 'fastify'

export interface ServerOptions {
    // Só requisições vindas desta rede (o nginx) podem informar o IP real (ADR 0017).
    trustedProxyCidr: string
    logStream?: Writable | undefined
}

// Nenhum log com endereço de rede (ADR 0019): a requisição é registrada só com
// método e URL, sem o endereço e a porta de origem que o Fastify registra por padrão.
function serializeRequest(request: FastifyRequest): { method: string; url: string } {
    return { method: request.method, url: request.url }
}

export function createServer(options: ServerOptions) {
    return Fastify({
        trustProxy: options.trustedProxyCidr,
        logger: {
            level: 'info',
            serializers: { req: serializeRequest },
            ...(options.logStream ? { stream: options.logStream } : {}),
        },
    }).withTypeProvider<TypeBoxTypeProvider>()
}

export type Server = ReturnType<typeof createServer>
