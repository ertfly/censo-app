# Implementation Plan: Busca de município

**Branch**: `001-municipality-search` (sem branch; trabalho direto na `main`) | **Date**: 2026-09-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-municipality-search/spec.md`

## Summary

Tela "Busca de cidades": autocomplete de municípios por início de palavra,
ignorando acento e maiúsculas, e ficha com os indicadores agregados do
município escolhido (população, setores, área, densidade, urbano/rural por
setores e população, sexo com "Sem informação"), com endereço compartilhável
e menu fixo entre as duas telas.

Abordagem técnica: busca por índice em memória no backend (sem mudança no
banco), indicadores por consulta no intervalo da chave primária de `setor`
(sem índice novo), contratos em `@censo/contracts`, página FSD com Combobox do
shadcn-vue e vue-query. Como primeira feature implementada, inclui a fundação
do projeto definida nos ADRs.

## Technical Context

**Language/Version**: TypeScript 6.0.3 sobre Node.js 24.21.0 LTS ([stack.md](../../.harness/stack.md))

**Primary Dependencies**: Fastify 5.12.5, TypeBox 1.3.34, Kysely 0.29.6 + better-sqlite3 13.0.3; Vue 3.5.43, Vite 8.3.1, Vue Router 5.3.1, @tanstack/vue-query 5.103.2, Tailwind CSS 4.3.3, shadcn-vue 2.8.2 / Reka UI 2.10.5, @fontsource-variable/archivo 5.3.0

**Storage**: SQLite `censo.sqlite` na raiz, somente leitura ([ADR 0018](../../.harness/decisions/0018-banco-na-raiz.md), [ADR 0007](../../.harness/decisions/0007-primeira-versao-somente-leitura.md))

**Testing**: Vitest 5.0.2, @vue/test-utils 2.5.1, Playwright 1.63.0 ([ADR 0009](../../.harness/decisions/0009-testes.md))

**Target Platform**: Docker Compose local (Linux containers), navegadores atuais ([ADR 0005](../../.harness/decisions/0005-docker-compose.md), [ADR 0016](../../.harness/decisions/0016-execucao-local.md))

**Project Type**: aplicação web (monorepo: `packages/contracts`, `backend`, `frontend`)

**Performance Goals**: sugestões e indicadores em até 1 s para o visitante (SC-002, SC-003); medido: busca em memória < 1 ms, indicadores do maior município ~10 ms, carga do índice ~2 ms ([research.md](research.md))

**Constraints**: banco somente leitura; nenhum serviço de terceiros; textos em pt-BR; código e rotas em inglês; só versões estáveis fixadas

**Scale/Scope**: 5.570 municípios pesquisáveis, 468.099 setores; 1 tela, 2 rotas de API + healthcheck

## Constitution Check

*GATE: verificado antes da fase 0 e novamente após a fase 1.*

| Princípio | Verificação | Situação |
|---|---|---|
| I. Documentação antes do código | Spec clarificada; plano sem código; implementação só após a documentação das 3 features | ✅ |
| II. Somente leitura | Conexão `readonly`, arquivo montado `:ro`; nenhuma escrita; busca sem migration | ✅ |
| III. Arquitetura e fronteiras | Queries com handler + porta de leitura; VOs no domínio; readers em `infra`; FSD com `pages/municipality-search`, `widgets/app-header`, `shared`; sem Query chamando Query | ✅ |
| IV. Contrato único | 2 rotas com schemas em `@censo/contracts` ([contracts/api.md](contracts/api.md)) | ✅ |
| V. Testes por camada | Unitário, integração e E2E definidos ([quickstart.md](quickstart.md)); nenhum teste usa `censo.sqlite` | ✅ |
| VI. Idioma | Rotas `/api/municipalities/...` e `/municipalities/...`; textos pt-BR; nomes em português só em `infra/database` | ✅ |
| VII. Versões estáveis | Todas as dependências na `stack.md`; nova: `@fontsource-variable/archivo` 5.3.0 (estável) | ✅ |
| VIII. Docker | Fundação cria `compose.yaml` e `compose.dev.yaml` | ✅ |
| IX. Design | [design.md](design.md) e [design-system.md](../../.harness/design-system.md) feitos com a skill `frontend-design` | ✅ |

Nenhuma violação. Pós-fase 1: mantido.

Índices iniciais: **nenhum**. A consulta de indicadores usa o intervalo da
chave primária de `setor`; a busca usa índice em memória (research R1, R2),
conforme o processo de [indexes.md](../../.harness/indexes.md).

## Project Structure

### Documentation (this feature)

```text
specs/001-municipality-search/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # fase 0
├── data-model.md        # fase 1
├── design.md            # fase 1 (layout da tela)
├── quickstart.md        # fase 1
├── contracts/
│   └── api.md           # fase 1
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks (ainda não criado)
```

### Source Code (repository root)

Apenas os arquivos desta feature e da fundação. Estrutura geral em
[architecture.md](../../.harness/architecture.md).

```text
package.json                     # workspaces
tsconfig.base.json
eslint.config.js
.prettierrc
.editorconfig
.dockerignore                    # exclui *.sqlite, node_modules, dist, .git
.env.example
compose.yaml
compose.dev.yaml
censo.sqlite                     # existente (Git LFS)

packages/contracts/src/
├── index.ts
├── common/error-response.contract.ts
└── municipalities/
    ├── search-municipalities.contract.ts
    └── get-municipality-indicators.contract.ts

backend/
├── Dockerfile
├── src/
│   ├── domain/
│   │   ├── value-objects/
│   │   │   ├── state-code.vo.ts
│   │   │   ├── municipality-code.vo.ts
│   │   │   ├── search-term.vo.ts
│   │   │   └── area-type.vo.ts
│   │   └── errors/
│   │       ├── invalid-state-code.error.ts
│   │       ├── invalid-municipality-code.error.ts
│   │       ├── invalid-search-term.error.ts
│   │       └── municipality-not-found.error.ts
│   ├── application/queries/
│   │   ├── search-municipalities/
│   │   │   ├── search-municipalities.handler.ts
│   │   │   └── municipality-search.reader.ts
│   │   └── get-municipality-indicators/
│   │       ├── get-municipality-indicators.handler.ts
│   │       └── municipality-indicators.reader.ts
│   ├── infra/
│   │   ├── database/
│   │   │   ├── connection.ts               # readonly, foreign_keys, DATABASE_PATH
│   │   │   ├── database-file-check.ts      # SQLite válido / ponteiro LFS
│   │   │   ├── database.types.ts           # tipos das tabelas (português)
│   │   │   ├── migrator.ts                 # migrate, migrate:down, verificação de pendentes
│   │   │   ├── migrations/0001-baseline.ts
│   │   │   └── readers/
│   │   │       ├── in-memory-municipality-search.reader.ts
│   │   │       └── kysely-municipality-indicators.reader.ts
│   │   └── http/
│   │       ├── server.ts
│   │       ├── error-handler.ts
│   │       └── routes/
│   │           ├── health.routes.ts
│   │           └── municipality.routes.ts
│   └── main.ts                              # composition root
└── test/
    ├── fixtures/                            # dados de teste (casos de borda do database.md)
    ├── unit/
    └── integration/

frontend/
├── Dockerfile
├── nginx.conf
├── src/
│   ├── app/                                 # main.ts, router.ts, plugins, styles (tema do design-system)
│   ├── pages/municipality-search/
│   │   ├── index.ts
│   │   ├── ui/                              # MunicipalitySearchPage, MunicipalityCombobox, MunicipalityRecord
│   │   ├── model/                           # use-selected-municipality (sincronia com URL)
│   │   └── api/                             # useMunicipalitySuggestions, useMunicipalityIndicators
│   ├── widgets/app-header/                  # menu fixo (usado pelas 2 páginas)
│   └── shared/
│       ├── ui/                              # componentes shadcn-vue, ProportionBar, DensityScale
│       ├── api/                             # http-client, error-messages
│       └── lib/                             # format (Intl pt-BR), largest-remainder
└── test/unit/

e2e/                                         # Playwright
```

**Structure Decision**: monorepo do [ADR 0013](../../.harness/decisions/0013-organizacao-do-repositorio.md),
backend em camadas do [ADR 0008](../../.harness/decisions/0008-arquitetura-backend.md),
frontend em FSD enxuto do [ADR 0014](../../.harness/decisions/0014-arquitetura-frontend.md).
`DensityScale` fica em `shared/ui` desde já, sem conhecimento de domínio,
porque também será usada no ranking da feature 002. A API de municípios fica
na página (só ela usa); sobe para `entities/municipality` se outra página
passar a usá-la.

## Complexity Tracking

Nenhuma violação da constituição a justificar.
