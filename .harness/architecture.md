# Arquitetura

> Visão consolidada das decisões [0001 a 0023](decisions/README.md).
> Em caso de divergência, vale o ADR.

## Visão geral

O censo-app é uma aplicação web para consultar dados agregados do censo
(UF, município, setor censitário e demografia) a partir de um banco SQLite
recebido pronto.

| Característica | Definição | ADR |
|---|---|---|
| Tipo | Aplicação web acessada pelo navegador | [0003](decisions/0003-frontend-vue.md) |
| Modo de dados | Somente leitura na v1; escrita em aberto | [0007](decisions/0007-primeira-versao-somente-leitura.md) |
| Execução | Docker Compose, um comando, máquina só com Docker | [0005](decisions/0005-docker-compose.md) |
| Ambiente | Local na v1, acesso só por `http://localhost` (a verificação contra bots exige contexto seguro); rede interna e internet exigem HTTPS, em novo ADR | [0016](decisions/0016-execucao-local.md), [0023](decisions/0023-v1-somente-localhost.md) |
| Proteção | Rate limit por IP + desafio ALTCHA local + cookie de sessão; sem terceiros | [0017](decisions/0017-protecao-contra-bots.md) |
| Acesso | Sem acesso externo ao banco; só o nginx publica porta | [0001](decisions/0001-banco-de-dados-sqlite.md), [0005](decisions/0005-docker-compose.md) |
| Idioma | Código e rotas em inglês; interface em pt-BR; banco em português | [conventions.md](conventions.md) |
| Versões | Somente estáveis, fixadas exatamente | [stack.md](stack.md) |

## Containers

### Produção (`docker compose up`)

```
                 ┌──────────────────────── rede interna do Compose ───────────────────────┐
                 │                                                                        │
Navegador ──────►│  frontend (nginx 1.30.5)              backend (Node 24.21.0 + Fastify)  │
  porta          │   ├── /       → build do Vue ─┐                                        │
  publicada      │   └── /api/*  → proxy ────────┼─────► /api/*                           │
                 │                               │          │                             │
                 │                               │          ▼                             │
                 │                               │   censo.sqlite (arquivo montado :ro)   │
                 └────────────────────────────────────────────────────────────────────────┘
```

- Frontend e API na mesma origem: sem CORS.
- O backend não publica porta no host.
- O frontend sobe depois do healthcheck do backend.
- O banco é aberto em modo leitura e montado como somente leitura.

### Desenvolvimento (`docker compose -f compose.dev.yaml up`)

```
Navegador ──► frontend (Vite dev, HMR) ── proxy /api ──► backend (npm run dev, recarga)
                                                              │
                                                              ▼
                                                     censo.sqlite (raiz montada)
```

- Código montado do host; `node_modules` em volumes nomeados.
- Migrations rodam aqui, por comando ([ADR 0015](decisions/0015-migrations.md)).

## Repositório

Monorepo com npm workspaces ([ADR 0013](decisions/0013-organizacao-do-repositorio.md)).

```
censo-app/
├── .harness/                 # arquitetura e decisões técnicas
├── .specify/                 # spec-kit: constituição, templates, scripts
├── specs/                    # 001-municipality-search, 002-state-ranking, 003-bot-protection
├── docs/user-stories.md      # histórias de usuário da v1
├── censo.sqlite              # banco (Git LFS), na raiz por requisito
├── packages/contracts/       # @censo/contracts: schemas da API
├── backend/                  # @censo/backend
├── frontend/                 # @censo/frontend
├── e2e/                      # @censo/e2e: Playwright e scripts da stack de teste
├── test/shared/              # casos de busca compartilhados entre backend e frontend
├── compose.yaml              # produção
├── compose.dev.yaml          # desenvolvimento
└── compose.e2e*.yaml         # stacks de E2E (ADR 0020)
```

## Backend

DDD simplificado com CQRS de leitura
([ADR 0008](decisions/0008-arquitetura-backend.md),
[ADR 0012](decisions/0012-comunicacao-entre-consultas-e-contextos.md)).

```
backend/src/
├── domain/          # Value Objects, erros de domínio
├── application/     # QueryHandlers e interfaces de leitura (portas)
├── infra/
│   ├── config/      # leitura e validação das variáveis de ambiente
│   ├── database/    # conexão, migrations, readers (nomes em português só aqui)
│   ├── http/        # servidor, rotas Fastify, error handler, protection/
│   └── logging/     # registros de proteção, descarte e relatório
└── main.ts          # composition root
```

Readers implementados:

| Porta | Implementação | Consulta |
|---|---|---|
| `MunicipalitySearchReader` | `InMemoryMunicipalitySearchReader` | índice em memória carregado antes de o servidor escutar |
| `MunicipalityIndicatorsReader` | `KyselyMunicipalityIndicatorsReader` | intervalo da chave primária de `setor` |
| `StatesReader` | `KyselyStatesReader` | tabela `uf`, ordenação pt-BR |
| `StateRankingReader` | `KyselyStateRankingReader` | intervalo da chave primária de `setor` pelo prefixo da UF |

| Camada | Pode importar |
|---|---|
| `domain` | Só `domain`; nenhum pacote externo |
| `application` | `domain`, `typebox`, `@censo/contracts` |
| `infra` | Tudo |
| `main.ts` | Tudo |

Regras principais:

- Um único contexto (censo); dados relacionados vêm por join no reader.
- Query não chama Query; domínio não chama Query.
- Injeção de dependência manual, sem container: `main.ts` monta a
  configuração e o banco, e `infra/http/build-app.ts` liga handlers e readers.
- Nenhum estado de requisição guardado em handlers ou readers.
- Erros de domínio viram códigos em inglês na resposta HTTP.

Reservado para quando houver escrita: `domain/entities`,
`domain/repositories`, `application/use-cases` (Commands).

## Frontend

Feature-Sliced Design enxuto ([ADR 0014](decisions/0014-arquitetura-frontend.md)).

```
frontend/src/
├── app/         # router, plugins, estilos, tema, layout
├── pages/       # uma slice por rota: municipality-search, state-ranking
├── widgets/     # app-header: menu fixo, status da verificação, avisos de proteção
└── shared/      # ui (shadcn-vue, escala de densidade, barra de proporção),
                 # api (cliente HTTP e sessão), lib (formatação pt-BR, busca por nome)
```

- Importação só para camadas abaixo e pela API pública (`index.ts`) de cada
  slice.
- `widgets` entrou com o menu fixo, usado nas duas páginas. `entities` e
  `features` entram quando houver conceito ou ação reusados em mais de uma
  página; até aqui não houve.
- Dados do servidor com `@tanstack/vue-query`; Pinia só para estado do
  cliente.
- Visual definido pela skill `frontend-design`, com Tailwind CSS, shadcn-vue e
  Reka UI ([ADR 0004](decisions/0004-ui-tailwind-shadcn-vue.md)).

## Proteção contra bots

[ADR 0017](decisions/0017-protecao-contra-bots.md).

```
Abertura da página:
  GET  /api/challenge  → desafio ALTCHA
  (navegador resolve a prova de trabalho)
  POST /api/session    → cookie de sessão assinado

Toda consulta /api/*:
  rate limit por IP (IP real via X-Forwarded-For do nginx)
  cookie de sessão válido, senão 401 SESSION_REQUIRED → frontend refaz o desafio
```

- `robots.txt` e bloqueio de User-Agents de robôs de IA no nginx.
- Segredos (`ALTCHA_HMAC_KEY`, `SESSION_SECRET`, `PROTECTION_LOG_KEY`) por variável de ambiente.
- Bloqueios e falhas de verificação registrados em arquivos JSONL diários, no
  volume `protection-log`, com identificador embaralhado do acesso, por 7 dias
  ([ADR 0019](decisions/0019-registros-de-protecao.md)).
- Nenhum log (backend ou nginx) contém endereço de rede.

## Fluxo de uma consulta

```
1. Navegador        GET /api/states/35/density-ranking (com cookie de sessão)
2. nginx            proxy para backend (X-Forwarded-For)
2a. infra/http      rate limit por IP e verificação da sessão
3. infra/http       valida params com o schema de @censo/contracts
4. application      QueryHandler: DTO → Value Objects (StateCode.create('35'))
5. infra/database   reader Kysely: soma de setor por município, pelo intervalo
                    da chave primária (colunas em português traduzidas para
                    inglês) → DTO de saída
6. infra/http       serializa a resposta pelo schema de saída
7. frontend         pages/state-ranking/api (vue-query, tipo do contrato)
8. pages            compõe a tela; textos e números em pt-BR
```

Erro: o domínio lança erro → o error handler responde com código em inglês
(ex.: `INVALID_STATE_CODE`) → `shared/api` traduz para mensagem em pt-BR.

## Contrato entre backend e frontend

`@censo/contracts` contém apenas schemas TypeBox de entrada e saída da API,
exportados como valor (validação) e tipo (compilação). Mudança de contrato
quebra a compilação das duas pontas
([ADR 0013](decisions/0013-organizacao-do-repositorio.md)).

## Dados

- Estrutura, qualidade e melhorias: [database.md](database.md).
- Índices: nenhum índice secundário foi necessário na v1. As agregações usam
  o intervalo da chave primária de `setor` e a busca de município usa índice
  em memória (research R1 e R2 das features 001 e 002). Um índice novo segue o
  processo de [indexes.md](indexes.md).
- Migrations: Kysely `Migrator`, migration de base para o banco existente,
  nunca executadas em produção ([ADR 0015](decisions/0015-migrations.md)).

## Qualidade

| Área | Definição | ADR |
|---|---|---|
| Formatação | Prettier, 4 espaços, sem ponto e vírgula, aspas simples | [0011](decisions/0011-lint-e-formatacao.md) |
| Lint | ESLint + typescript-eslint + eslint-plugin-vue | [0011](decisions/0011-lint-e-formatacao.md) |
| Fronteiras | eslint-plugin-boundaries (backend e frontend), com erro | [0011](decisions/0011-lint-e-formatacao.md), [0014](decisions/0014-arquitetura-frontend.md) |
| Testes unitários | Vitest: Value Objects, QueryHandlers, composables | [0009](decisions/0009-testes.md) |
| Testes de integração | Vitest: readers e rotas contra SQLite em memória | [0009](decisions/0009-testes.md) |
| Testes E2E | Playwright contra a stack no Docker, com a proteção ligada: `compose.e2e.yaml` (suíte geral) e `compose.e2e-protection.yaml` (limite e expiração) | [0009](decisions/0009-testes.md), [0020](decisions/0020-stacks-de-e2e.md) |

Nenhum teste usa `censo.sqlite`.

## Pendências

| Pendência | Onde será tratada |
|---|---|
| Tratamento do município `.` (hoje só entra na área total da UF) | Decisão do responsável pelo produto |
| Acesso pela rede interna ou internet (HTTPS, domínio) | Novo ADR, previsto nos ADRs 0016 e 0023 |
