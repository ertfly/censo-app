# Decisões (ADRs)

Cada decisão técnica relevante é registrada em um arquivo
`NNNN-titulo-curto.md`, numerado em sequência a partir de `0001`.

## Índice

| # | Título | Status |
|---|---|---|
| [0001](0001-banco-de-dados-sqlite.md) | Banco de dados SQLite em data/ versionado com Git LFS | Aceito (revisto pelo 0007; localização substituída pelo 0018) |
| [0002](0002-runtime-e-backend.md) | Runtime Node.js LTS com TypeScript e backend em Fastify | Aceito (revisto pelo 0010) |
| [0003](0003-frontend-vue.md) | Frontend em Vue 3 com Composition API e Vite | Aceito (revisto pelo 0014) |
| [0004](0004-ui-tailwind-shadcn-vue.md) | UI com Tailwind CSS, shadcn-vue e Reka UI | Aceito |
| [0005](0005-docker-compose.md) | Execução com Docker Compose: produção e desenvolvimento | Aceito (revisto pelo 0007, 0013, 0018 e 0021, complementado pelo 0016) |
| [0006](0006-acesso-a-dados.md) | Acesso a dados com better-sqlite3 e Kysely | Aceito (complementado pelo 0015, revisto pelo 0021) |
| [0007](0007-primeira-versao-somente-leitura.md) | Primeira versão somente leitura, escrita em aberto | Aceito (revisto pelo 0018) |
| [0008](0008-arquitetura-backend.md) | Arquitetura do backend: DDD simplificado com CQRS de leitura | Aceito (complementado pelo 0012, revisto pelo 0013) |
| [0009](0009-testes.md) | Estratégia de testes automatizados | Aceito (complementado pelo 0020) |
| [0010](0010-typescript-6.md) | TypeScript 6.0.3 no lugar do TypeScript 7 | Aceito |
| [0011](0011-lint-e-formatacao.md) | Lint, formatação e fronteiras de importação | Aceito (revisto pelo 0013 e 0014) |
| [0012](0012-comunicacao-entre-consultas-e-contextos.md) | Comunicação entre consultas e entre contextos | Aceito |
| [0013](0013-organizacao-do-repositorio.md) | Monorepo com npm workspaces e pacote de contratos | Aceito (revisto pelo 0018) |
| [0014](0014-arquitetura-frontend.md) | Arquitetura do frontend: Feature-Sliced Design enxuto | Aceito |
| [0015](0015-migrations.md) | Migrations com o Migrator do Kysely | Aceito |
| [0016](0016-execucao-local.md) | Execução local na primeira versão | Aceito (revisto pelo 0023) |
| [0017](0017-protecao-contra-bots.md) | Proteção contra bots com rate limit e ALTCHA local | Aceito (complementado pelo 0019, revisto pelos 0022 e 0024) |
| [0018](0018-banco-na-raiz.md) | Banco de dados na raiz do repositório | Aceito (revisto pelo 0025) |
| [0019](0019-registros-de-protecao.md) | Registros de proteção sem endereço de rede | Aceito |
| [0020](0020-stacks-de-e2e.md) | Stacks de E2E com a proteção ligada | Aceito |
| [0021](0021-compilacao-do-driver-sqlite.md) | Compilação do better-sqlite3 nas imagens Docker | Aceito |
| [0022](0022-limite-de-consultas-proprio.md) | Limite de consultas no hook global, sem @fastify/rate-limit | Aceito |
| [0023](0023-v1-somente-localhost.md) | Primeira versão acessada só por localhost | Aceito |
| [0024](0024-segredos-gerados-na-primeira-subida.md) | Segredos gerados na primeira subida | Aceito |
| [0025](0025-banco-fora-do-git-lfs.md) | Banco versionado sem Git LFS | Aceito |

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
