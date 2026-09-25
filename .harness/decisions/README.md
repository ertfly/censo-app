# Decisões (ADRs)

Cada decisão técnica relevante é registrada em um arquivo
`NNNN-titulo-curto.md`, numerado em sequência a partir de `0001`.

## Índice

| # | Título | Status |
|---|---|---|
| [0001](0001-banco-de-dados-sqlite.md) | Banco de dados SQLite em data/ versionado com Git LFS | Aceito (revisto pelo 0007) |
| [0002](0002-runtime-e-backend.md) | Runtime Node.js LTS com TypeScript e backend em Fastify | Aceito (revisto pelo 0010) |
| [0003](0003-frontend-vue.md) | Frontend em Vue 3 com Composition API e Vite | Aceito (revisto pelo 0014) |
| [0004](0004-ui-tailwind-shadcn-vue.md) | UI com Tailwind CSS, shadcn-vue e Reka UI | Aceito |
| [0005](0005-docker-compose.md) | Execução com Docker Compose: produção e desenvolvimento | Aceito (revisto pelo 0007 e 0013, complementado pelo 0016) |
| [0006](0006-acesso-a-dados.md) | Acesso a dados com better-sqlite3 e Kysely | Aceito (complementado pelo 0015) |
| [0007](0007-primeira-versao-somente-leitura.md) | Primeira versão somente leitura, escrita em aberto | Aceito |
| [0008](0008-arquitetura-backend.md) | Arquitetura do backend: DDD simplificado com CQRS de leitura | Aceito (complementado pelo 0012, revisto pelo 0013) |
| [0009](0009-testes.md) | Estratégia de testes automatizados | Aceito |
| [0010](0010-typescript-6.md) | TypeScript 6.0.3 no lugar do TypeScript 7 | Aceito |
| [0011](0011-lint-e-formatacao.md) | Lint, formatação e fronteiras de importação | Aceito (revisto pelo 0013 e 0014) |
| [0012](0012-comunicacao-entre-consultas-e-contextos.md) | Comunicação entre consultas e entre contextos | Aceito |
| [0013](0013-organizacao-do-repositorio.md) | Monorepo com npm workspaces e pacote de contratos | Aceito |
| [0014](0014-arquitetura-frontend.md) | Arquitetura do frontend: Feature-Sliced Design enxuto | Aceito |
| [0015](0015-migrations.md) | Migrations com o Migrator do Kysely | Aceito |
| [0016](0016-execucao-local.md) | Execução local na primeira versão | Aceito |

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
