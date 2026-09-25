# Decisões (ADRs)

Cada decisão técnica relevante é registrada em um arquivo
`NNNN-titulo-curto.md`, numerado em sequência a partir de `0001`.

## Índice

| # | Título | Status |
|---|---|---|
| [0001](0001-banco-de-dados-sqlite.md) | Banco de dados SQLite em data/ versionado com Git LFS | Aceito |
| [0002](0002-runtime-e-backend.md) | Runtime Node.js LTS com TypeScript e backend em Fastify | Aceito |
| [0003](0003-frontend-vue.md) | Frontend em Vue 3 com Composition API e Vite | Aceito |
| [0004](0004-ui-tailwind-shadcn-vue.md) | UI com Tailwind CSS, shadcn-vue e Reka UI | Aceito |
| [0005](0005-docker-compose.md) | Execução com Docker Compose: produção e desenvolvimento | Aceito |
| [0006](0006-acesso-a-dados.md) | Acesso a dados com better-sqlite3 e Kysely | Aceito |
| [0007](0007-primeira-versao-somente-leitura.md) | Primeira versão somente leitura, escrita em aberto | Aceito |
| [0008](0008-arquitetura-backend.md) | Arquitetura do backend: DDD simplificado com CQRS de leitura | Aceito |

## Modelo

```markdown
# NNNN. Título da decisão

- Status: Proposto | Aceito | Substituído por NNNN
- Data: AAAA-MM-DD

## Contexto

Qual problema ou necessidade motiva a decisão.

## Decisão

O que foi decidido.

## Alternativas consideradas

- Alternativa A: prós e contras.
- Alternativa B: prós e contras.

## Consequências

O que muda, o que fica mais fácil e o que fica mais difícil.
```
