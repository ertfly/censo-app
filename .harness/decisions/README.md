# Decisões (ADRs)

Cada decisão técnica relevante é registrada em um arquivo
`NNNN-titulo-curto.md`, numerado em sequência a partir de `0001`.

## Índice

| # | Título | Status |
|---|---|---|
| [0001](0001-banco-de-dados-sqlite.md) | Banco de dados SQLite em data/ versionado com Git LFS | Aceito |
| [0002](0002-runtime-e-backend.md) | Runtime Node.js LTS com TypeScript e backend em Fastify | Aceito |

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
