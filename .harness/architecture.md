# Arquitetura

> Visão consolidada das decisões [0001 a 0019](decisions/README.md).
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
| Ambiente | Local na v1 (máquina ou rede interna); internet exige novo ADR | [0016](decisions/0016-execucao-local.md) |
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
├── .specify/, specs/         # spec-kit (a criar)
├── censo.sqlite              # banco (Git LFS), na raiz por requisito
├── packages/contracts/       # @censo/contracts: schemas da API
├── backend/                  # @censo/backend
├── frontend/                 # @censo/frontend
├── compose.yaml              # produção
└── compose.dev.yaml          # desenvolvimento
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
│   ├── database/    # conexão, migrations, readers Kysely (nomes em português só aqui)
│   └── http/        # rotas Fastify, error handler
└── main.ts          # composition root
```

| Camada | Pode importar |
|---|---|
| `domain` | Só `domain`; nenhum pacote externo |
| `application` | `domain`, `typebox`, `@censo/contracts` |
| `infra` | Tudo |
| `main.ts` | Tudo |

Regras principais:

- Um único contexto (censo); dados relacionados vêm por join no reader.
- Query não chama Query; domínio não chama Query.
- Injeção de dependência manual no `main.ts`, sem container.
- Nenhum estado de requisição guardado em handlers ou readers.
- Erros de domínio viram códigos em inglês na resposta HTTP.

Reservado para quando houver escrita: `domain/entities`,
`domain/repositories`, `application/use-cases` (Commands).

## Frontend

Feature-Sliced Design enxuto ([ADR 0014](decisions/0014-arquitetura-frontend.md)).

```
frontend/src/
├── app/         # router, plugins, estilos, tema
├── pages/       # uma slice por rota
├── entities/    # conceitos do domínio reusados em mais de uma página
└── shared/      # ui (shadcn-vue), api (cliente HTTP), lib (formatadores pt-BR)
```

- Importação só para camadas abaixo e pela API pública (`index.ts`) de cada
  slice.
- `features` e `widgets` entram quando houver reuso em mais de uma página.
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
1. Navegador        GET /api/states/35/municipalities (com cookie de sessão)
2. nginx            proxy para backend (X-Forwarded-For)
2a. infra/http      rate limit por IP e verificação da sessão
3. infra/http       valida params com o schema de @censo/contracts
4. application      QueryHandler: DTO → Value Objects (StateCode.create('35'))
5. infra/database   reader Kysely: SELECT em municipio (colunas em português
                    traduzidas para inglês) → DTO de saída
6. infra/http       serializa a resposta pelo schema de saída
7. frontend         entities/municipality/api (vue-query, tipo do contrato)
8. pages            compõe a tela; textos e números em pt-BR
```

Erro: o domínio lança erro → o error handler responde com código em inglês
(ex.: `STATE_NOT_FOUND`) → `shared/api` traduz para mensagem em pt-BR.

## Contrato entre backend e frontend

`@censo/contracts` contém apenas schemas TypeBox de entrada e saída da API,
exportados como valor (validação) e tipo (compilação). Mudança de contrato
quebra a compilação das duas pontas
([ADR 0013](decisions/0013-organizacao-do-repositorio.md)).

## Dados

- Estrutura, qualidade e melhorias: [database.md](database.md).
- Índices: não há índices secundários; são definidos no `plan.md` de cada
  feature do spec-kit e criados via migration ([indexes.md](indexes.md)).
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
| Testes E2E | Playwright contra a stack no Docker | [0009](decisions/0009-testes.md) |

Nenhum teste usa `censo.sqlite`.

## Pendências

| Pendência | Onde será tratada |
|---|---|
| Índices iniciais | `plan.md` das features do spec-kit |
| Tratamento do município `.` | Decisão do responsável pelo produto |
| Portas padrão e comandos (testes, lint, migrations) | Montagem do projeto |
| Metas de cobertura e integração contínua | Decisão futura |
| Escrita no banco | Novo ADR, a partir de história de usuário |
| Suporte a outros idiomas na interface | Fora da v1 |
| Retorno ao TypeScript 7 | Quando o typescript-eslint estável suportar |
| Exposição na internet (servidor, domínio, HTTPS) | Novo ADR ([0016](decisions/0016-execucao-local.md)) |
| Valores do rate limit, da sessão e do desafio | `plan.md` da feature de proteção contra bots |
