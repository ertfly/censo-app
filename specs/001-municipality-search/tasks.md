---
description: "Tarefas da feature 001 (Busca de município), incluindo a fundação do projeto"
---

# Tasks: Busca de município

**Input**: `specs/001-municipality-search/` (plan.md, spec.md, research.md, data-model.md, contracts/api.md, design.md, quickstart.md)

**Prerequisites**: nenhum (esta feature contém a fundação do projeto)

**Tests**: obrigatórios por camada (Princípio V, [ADR 0009](../../.harness/decisions/0009-testes.md)). Nenhum teste usa `censo.sqlite` diretamente.

**Organização**: fases 1 e 2 são a fundação de todo o projeto; fases 3 e 4 são as user stories desta feature.

## Ordem de implementação do projeto

```
001 Fase 1 (Setup) → 001 Fase 2 (Foundational)
   → 003 inteira (specs/003-bot-protection/tasks.md)
   → 001 Fases 3, 4 e 5
   → 002 inteira (specs/002-state-ranking/tasks.md)
```

As rotas desta feature já nascem protegidas pela 003; os testes de rota e E2E obtêm sessão com o helper criado na 003.

## Regras de execução

- Um commit por tarefa concluída: Conventional Commits sem escopo, até 72 caracteres, uma linha, direto na `main`, sem squash.
- Todo comando de Node roda em container (`docker compose -f compose.dev.yaml run --rm <serviço> …`); o host só precisa de Docker e Git LFS.
- Versões exatamente como em [stack.md](../../.harness/stack.md), sem `^` ou `~`.
- Toda tarefa de interface começa invocando a skill `frontend-design` (Princípio IX) e segue [design-system.md](../../.harness/design-system.md) e [design.md](design.md).
- Formatação: Prettier com 4 espaços; nomes de código e rotas em inglês; textos da interface em pt-BR.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1 ou US2 da spec 001

---

## Phase 1: Setup (fundação do projeto)

**Purpose**: monorepo, ferramentas, containers e configuração base.

- [X] T001 Criar `package.json` na raiz com `"private": true`, `"type": "module"`, `"workspaces": ["packages/*", "backend", "frontend", "e2e"]`, `"engines": { "node": "24.21.0" }` e scripts orquestradores (`lint`, `format`, `format:check`, `test`, `build`); criar `.nvmrc` com `24.21.0`
- [X] T002 [P] Criar `tsconfig.base.json` na raiz com `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `target: ES2023`, `skipLibCheck: true`, `verbatimModuleSyntax: true`
- [X] T003 [P] Criar `.editorconfig` (4 espaços, LF, UTF-8, newline final, sem espaço no fim da linha), `.prettierrc` (`tabWidth: 4`, `useTabs: false`, `printWidth: 100`, `semi: false`, `singleQuote: true`, `trailingComma: "all"`, `endOfLine: "lf"`) e `.prettierignore` (`**/*.md`, `*.sqlite`, `dist`, `coverage`, `playwright-report`, `test-results`)
- [X] T004 [P] Criar `.gitignore` (`node_modules`, `dist`, `.env`, `coverage`, `playwright-report`, `test-results`, `e2e/.tmp`) e `.dockerignore` (`node_modules`, `**/dist`, `.git`, `*.sqlite`, `.harness`, `specs`, `docs`, `e2e`, `.env`)
- [X] T005 [P] Criar pacote `packages/contracts` com `package.json` (`"name": "@censo/contracts"`, `"type": "module"`, `exports` apontando para `dist/index.js` e `dist/index.d.ts`, dependência `typebox` `1.3.34`, script `build: tsc -b`), `tsconfig.json` (`composite: true`, `outDir: dist`, `rootDir: src`) e `src/index.ts` vazio
- [X] T006 [P] Criar pacote `backend` com `package.json` (`"name": "@censo/backend"`, `"type": "module"`, `imports` com condições: `"#domain/*": { "development": "./src/domain/*", "default": "./dist/domain/*" }`, e o mesmo para `#application/*` e `#infra/*`), dependências `fastify` 5.12.5, `@fastify/type-provider-typebox` 6.1.0, `typebox` 1.3.34, `kysely` 0.29.6, `better-sqlite3` 13.0.3, `@censo/contracts` (workspace); dev: `typescript` 6.0.3, `vitest` 5.0.2, `tsx` 4.23.15, `@types/node` 24.13.6, `@types/better-sqlite3` 9.6.0; scripts `dev` (`tsx watch --conditions=development src/main.ts`), `build` (`tsc -b`), `start` (`node dist/main.js`), `test`, `migrate`, `migrate:down`; `tsconfig.json` com referência a `packages/contracts` e `customConditions: ["development"]`, e `vitest.config.ts` com ambiente `node` e `resolve.conditions: ["development"]`
- [X] T007 [P] Criar pacote `frontend` com `package.json` (`"name": "@censo/frontend"`), dependências `vue` 3.5.43, `vue-router` 5.3.1, `@tanstack/vue-query` 5.103.2, `reka-ui` 2.10.5, `@fontsource-variable/archivo` 5.3.0, `@censo/contracts` (workspace); dev: `vite` 8.3.1, `@vitejs/plugin-vue` 6.0.9, `tailwindcss` 4.3.3, `@tailwindcss/vite` 4.3.3, `typescript` 6.0.3, `vue-tsc` 3.3.11, `vitest` 5.0.2, `@vue/test-utils` 2.5.1, `jsdom` 30.1.1; `vite.config.ts` com alias `@/` → `src/`, proxy de `/api` para `http://backend:3000` com `xfwd: true`, `server.host: 0.0.0.0`; `tsconfig.json` `index.html` com `<html lang="pt-BR">` e `vitest.config.ts` com ambiente `jsdom`
- [X] T008 [P] Criar pacote `e2e` com `package.json` (`"name": "@censo/e2e"`, dev `@playwright/test` 1.63.0 e `better-sqlite3` 13.0.3 para comparar a tela com consultas diretas na cópia do banco) e `playwright.config.ts` apontando para `E2E_BASE_URL` (padrão `http://frontend`, porta 80 do nginx dentro da rede do Compose)
- [X] T009 Criar `eslint.config.js` na raiz com ESLint 10.11.0, `typescript-eslint` 8.70.1, `eslint-plugin-vue` 10.11.1, `@vue/eslint-config-typescript` 14.9.0, `eslint-config-prettier` 10.1.8, `eslint-plugin-boundaries` 7.2.0 e `eslint-import-resolver-typescript` 4.4.5 (resolve os imports `#domain/*` e `@censo/contracts` para o boundaries), aplicando com erro: backend `domain` só importa `domain` e nenhum pacote externo; `application` importa `domain`, `application`, `typebox`, `@censo/contracts`; `infra` e `main.ts` importam tudo; `packages/contracts` só importa `typebox`; frontend `app → pages → widgets → features → entities → shared`, sem importação entre slices da mesma camada e só pela API pública (`index.ts`) de cada slice ([ADR 0011](../../.harness/decisions/0011-lint-e-formatacao.md), [ADR 0013](../../.harness/decisions/0013-organizacao-do-repositorio.md), [ADR 0014](../../.harness/decisions/0014-arquitetura-frontend.md)); adicionar as dependências de lint ao `package.json` da raiz
- [X] T010 [P] Criar `backend/Dockerfile` com estágios `dev` (`node:24.21.0-slim`, `npm run dev`), `build` (`npm ci`, build de `packages/contracts` e `backend`) e `prod` (`node:24.21.0-slim`, só dependências de produção, `node dist/main.js`, usuário não root), com contexto de build na raiz
- [X] T011 [P] Criar `frontend/Dockerfile` com estágios `dev` (`node:24.21.0-slim`, `npm run dev`), `build` (`vite build`) e `prod` (`nginx:1.30.5-alpine` servindo `dist`), e `frontend/nginx.conf` com fallback da SPA para `index.html`, proxy de `/api/` para `http://backend:3000`, `proxy_set_header X-Forwarded-For $remote_addr` (sobrescreve, não acrescenta) e `log_format` sem `$remote_addr` e sem `$http_x_forwarded_for` ([ADR 0019](../../.harness/decisions/0019-registros-de-protecao.md))
- [X] T012 Criar `compose.yaml` (produção): serviços `backend` (estágio `prod`, `${DATABASE_FILE:-./censo.sqlite}` montado em `/app/data/censo.sqlite:ro`, `DATABASE_PATH=/app/data/censo.sqlite`, `env_file: .env`, `NODE_ENV=production`, healthcheck com o próprio Node (a imagem slim não tem `curl` nem `wget`): `node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"`, `restart: unless-stopped`, sem porta publicada) e `frontend` (estágio `prod`, porta `${APP_PORT:-8080}:80`, `depends_on` com `condition: service_healthy`); rede `censo` com sub-rede fixa `172.28.0.0/24` ([ADR 0005](../../.harness/decisions/0005-docker-compose.md), [ADR 0018](../../.harness/decisions/0018-banco-na-raiz.md))
- [X] T013 Criar `compose.dev.yaml`: serviços `backend` e `frontend` no estágio `dev`, raiz do repositório montada em `/app`, `node_modules` em volumes nomeados, `DATABASE_PATH=/app/censo.sqlite` (gravável para migrations), portas `3000` e `5173` publicadas, serviço `deps` que roda `npm install` uma vez antes dos demais, e rede `censo` com sub-rede fixa própria `172.29.0.0/24` (diferente da produção, para as duas stacks rodarem juntas) com `TRUSTED_PROXY_CIDR` correspondente; `@censo/contracts` com condição `development` apontando para `src/index.ts`
- [X] T014 [P] Criar `.env.example` com `APP_PORT=8080`, `DATABASE_FILE=./censo.sqlite` e comentários explicando cada variável (as variáveis da 003 entram nas tarefas da 003)
- [X] T015 [P] Criar `test/shared/text-search.cases.json` com os casos de busca compartilhados entre backend e frontend: `{ "term": "sao pau", "matches": ["São Paulo"] }`, `{ "term": "paulo", "matches": ["São Paulo", "Paulo Afonso"] }`, `{ "term": "aulo", "matches": [] }`, `{ "term": "BOM JESUS", "matches": ["Bom Jesus"] }`, `{ "term": "arco", "matches": ["Pau D'Arco"] }` (research R4 da 002)
- [X] T016 Rodar `npm install` no container e commitar `package-lock.json`; rodar `npm run lint` e `npm run format:check` sem erros no projeto vazio

---

## Phase 2: Foundational (fundação do projeto)

**Purpose**: infraestrutura que bloqueia todas as features.

**⚠️ CRITICAL**: nenhuma user story começa antes desta fase.

### Backend: banco

- [X] T017 Criar `backend/src/infra/database/database.types.ts` com os tipos Kysely das tabelas em português, fiéis ao schema de [database.md](../../.harness/database.md): `uf { cd_uf: string; nm_uf: string }`, `municipio { cd_mun: string; nm_mun: string; cd_uf: string }`, `setor { cd_setor: string; cd_mun: string; situacao: string | null; area_km2: number | null; populacao: number | null }`, `demografia { cd_setor: string; moradores: number | null; homens: number | null; mulheres: number | null }`
- [X] T018 Criar `backend/src/infra/database/connection.ts`: abre `DATABASE_PATH` com better-sqlite3 (`readonly: true` sempre na aplicação, inclusive em dev; só o script de migration abre com escrita; `fileMustExist: true`), aplica `PRAGMA foreign_keys = ON` e retorna `Kysely<Database>` com `SqliteDialect` ([ADR 0006](../../.harness/decisions/0006-acesso-a-dados.md), [ADR 0007](../../.harness/decisions/0007-primeira-versao-somente-leitura.md))
- [X] T019 [P] Criar `backend/src/infra/database/database-file-check.ts`: lê os primeiros bytes de `DATABASE_PATH`; se começarem com `version https://git-lfs`, encerra com mensagem explicando que o arquivo é um ponteiro do Git LFS e que é preciso rodar `git lfs pull`; se não começarem com `SQLite format 3\0`, encerra informando arquivo inválido
- [X] T020 [P] Teste unitário em `backend/test/unit/infra/database-file-check.test.ts`: arquivo SQLite válido, ponteiro LFS e arquivo qualquer
- [X] T021 Criar `backend/src/infra/database/migrations/0001-baseline.ts`: `up` cria `uf`, `municipio`, `setor` e `demografia` com `CREATE TABLE IF NOT EXISTS`, colunas, chaves primárias, referências e `WITHOUT ROWID` exatamente como no banco entregue; `down` lança erro explicando que desfazer a base apagaria os dados do censo ([ADR 0015](../../.harness/decisions/0015-migrations.md))
- [X] T022 Criar `backend/src/infra/database/migrator.ts` com `migrateToLatest`, `migrateDown` e `listPendingMigrations` (Migrator do Kysely com lista explícita de migrations, para dev, build e testes carregarem as mesmas) e os scripts `backend/src/infra/database/migrate.ts` e `migrate-down.ts` usados por `npm run migrate` e `npm run migrate:down`
- [X] T023 Aplicar a migration de base ao `censo.sqlite` com `docker compose -f compose.dev.yaml run --rm backend npm run migrate`, conferir que só foram criadas `kysely_migration` e `kysely_migration_lock` e commitar o banco (Git LFS)
- [X] T024 Criar helper de testes `backend/test/helpers/create-test-database.ts`: SQLite em memória, aplica todas as migrations e carrega `backend/test/fixtures/census.fixture.ts`
- [X] T025 Criar `backend/test/fixtures/census.fixture.ts` com dados mínimos que cobrem os casos de borda de [database.md](../../.harness/database.md#qualidade-dos-dados): UFs 22 (PI), 25 (PB), 15 (PA), 17 (TO), 29 (BA), 35 (SP), 43 (RS), 53 (DF); municípios "Bom Jesus" em PI e PB, "Pau D'Arco" em PA e TO, "Paulo Afonso" (BA), "São Paulo" (SP), "Brasília" (DF), o registro `.` do RS com 2 setores de população 0; setores urbanos, rurais e sem `situacao`; linhas de `demografia` com `homens` e `mulheres` nulos; setores com população 0 sem linha em `demografia`
- [X] T026 [P] Teste de integração `backend/test/integration/infra/migrations.test.ts`: a base cria o schema do zero em memória; `listPendingMigrations` retorna vazio após `migrateToLatest`; `down` da base lança erro

### Backend: domínio e HTTP

- [X] T027 [P] Criar `backend/src/domain/errors/domain-error.ts` (classe base com `code` em inglês) e `backend/src/domain/errors/invalid-state-code.error.ts` (`INVALID_STATE_CODE`)
- [X] T028 [P] Criar `backend/src/domain/value-objects/state-code.vo.ts`: construtor privado, `StateCode.create(value)` aceita só 2 dígitos entre os 27 códigos de UF, expõe `value` e `abbreviation` (tabela fixa: 11 RO, 12 AC, 13 AM, 14 RR, 15 PA, 16 AP, 17 TO, 21 MA, 22 PI, 23 CE, 24 RN, 25 PB, 26 PE, 27 AL, 28 SE, 29 BA, 31 MG, 32 ES, 33 RJ, 35 SP, 41 PR, 42 SC, 43 RS, 50 MS, 51 MT, 52 GO, 53 DF), `equals()` e `Object.freeze(this)`; lança `InvalidStateCodeError`
- [X] T029 [P] Teste unitário `backend/test/unit/domain/state-code.vo.test.ts`: os 27 códigos e siglas, formato inválido, código fora da lista, `equals`
- [X] T030 [P] Criar `packages/contracts/src/common/error-response.contract.ts` (`{ code: string }`) e exportar em `packages/contracts/src/index.ts`
- [X] T031 Criar `backend/src/infra/http/server.ts`: Fastify com `@fastify/type-provider-typebox`, logger com serializador de requisição sem endereço e porta de origem ([ADR 0019](../../.harness/decisions/0019-registros-de-protecao.md)), `trustProxy` lido de `TRUSTED_PROXY_CIDR` (padrão `172.28.0.0/24`)
- [X] T032 Criar `backend/src/infra/http/error-handler.ts`: `DomainError` → status pelo tipo do erro (`invalid` → 400, `not_found` → 404; o domínio não conhece HTTP) e corpo `{ code }`; erro de validação de schema → `400` com o código declarado pela rota; qualquer outro erro → `500` com `{ code: "INTERNAL_ERROR" }` sem detalhes internos
- [X] T033 [P] Criar `backend/src/infra/http/routes/health.routes.ts` com `GET /api/health` → `{ status: "ok" }`
- [X] T034 Criar `backend/src/main.ts` (composition root): valida o arquivo do banco (T019), abre a conexão, com `NODE_ENV=production` recusa subir se `listPendingMigrations` não estiver vazio (informando quais), cria o servidor, registra error handler e rotas, escuta em `PORT` (padrão `3000`)
- [X] T035 [P] Teste de integração `backend/test/integration/http/health.test.ts` com `fastify.inject()`: `200 { status: "ok" }`; erro não tratado vira `500 INTERNAL_ERROR`; o log de uma requisição não contém o endereço de origem

### Frontend: casca da aplicação

- [X] T036 Invocar a skill `frontend-design` e criar `frontend/src/app/styles/main.css` com Tailwind 4 e os tokens do [design-system.md](../../.harness/design-system.md) (cores nomeadas, Archivo variável, `tabular-nums` para números, foco de 2px em Ciano de marcação, `prefers-reduced-motion`); confirmar se `@fontsource-variable/archivo` expõe o eixo `wdth`; se não expuser, substituir a variação de largura por peso e tamanho e registrar a mudança em `.harness/design-system.md`
- [X] T037 Inicializar shadcn-vue 2.8.2 com `components.json` apontando para `@/shared/ui`, adicionar os componentes `input`, `button`, `combobox`, `select` e `table` com `shadcn-vue add` (sem `init`, para não sobrescrever o tema), criar `@/shared/lib/utils.ts` (`cn`), fixar as dependências trazidas pelo CLI e registrá-las no `stack.md`, mapear as variáveis de tema do shadcn para a paleta e reformatar com Prettier (4 espaços)
- [X] T038 [P] Criar `frontend/src/shared/lib/format.ts` com `formatInteger`, `formatDecimal2`, `formatPercent1` e `formatKm2`/`formatDensity` usando `Intl.NumberFormat('pt-BR')` (população e contagens sem decimais; área e densidade com 2 casas; percentuais com 1 casa) e teste `frontend/test/unit/shared/format.test.ts` (`203.080.756`, `0,54 km²`, `51,5%`)
- [X] T039 [P] Criar `frontend/src/shared/lib/largest-remainder.ts` (percentuais com 1 casa pelo método do maior resto, soma exatamente 100,0) e teste `frontend/test/unit/shared/largest-remainder.test.ts` com casos em que o arredondamento simples daria 99,9 e 100,1
- [X] T040 [P] Criar `frontend/src/shared/lib/document-title.ts` (`setDocumentTitle(prefix?)` → `"<prefix> - Censo 2022"` ou `"Censo 2022"`) e teste
- [X] T041 Criar `frontend/src/shared/api/http-client.ts` (`getJson<T>(path)` com prefixo `/api`, `ApiError` com `code` e `status`, `retryAfterSeconds` opcional) e `frontend/src/shared/api/error-messages.ts` (mapa código → mensagem pt-BR de [contracts/api.md](contracts/api.md#mensagens-do-frontend-por-código)); teste `frontend/test/unit/shared/error-messages.test.ts`
- [X] T042 Invocar a skill `frontend-design` e criar `frontend/src/widgets/app-header/` (`AppHeader.vue` com "Censo 2022", links "Busca de cidades" e "Busca por estado", `aria-current="page"` na tela atual, espaço reservado para o status de verificação da 003; `index.ts`) e `frontend/src/app/ui/AppLayout.vue` (menu fixo, `<RouterView>` e rodapé "Fonte: IBGE, Censo Demográfico 2022")
- [X] T043 Criar `frontend/src/app/router.ts` (`/` redireciona para `/municipalities`; `/municipalities` e `/municipalities/:municipalityCode` para a página da 001; `/states` e `/states/:stateCode` para a página da 002 com placeholder até a 002) e `frontend/src/app/main.ts` (Vue, router, `VueQueryPlugin` com `staleTime: Infinity` por padrão, estilos)
- [X] T044 [P] Teste unitário `frontend/test/unit/widgets/app-header.test.ts`: indicação da tela atual em cada rota
- [X] T045 Criar `e2e/scripts/prepare-database.sh` (copia `censo.sqlite` para `e2e/.tmp/censo.sqlite`), `compose.e2e.yaml` (sobre o `compose.yaml`: `DATABASE_FILE=./e2e/.tmp/censo.sqlite`, `RATE_LIMIT_MAX=100000`, serviço `e2e` com a imagem `mcr.microsoft.com/playwright:v1.63.0-noble` na rede `censo`) e `compose.e2e-protection.yaml` (mesma base com os valores padrão da proteção e `SESSION_TTL_SECONDS=60`), e o script `e2e/scripts/run.sh` que sobe cada stack e roda os testes correspondentes ([ADR 0020](../../.harness/decisions/0020-stacks-de-e2e.md)). Na implementação: sub-redes próprias (`172.30.0.0/24` e `172.31.0.0/24`) para rodar junto com a produção; imagem `e2e/Dockerfile` com ferramentas de compilação (ADR 0021); testes montados como volume, não copiados; dois projetos do Playwright (`general` e `protection`); `*.tsbuildinfo` no `.dockerignore`
- [X] T046 Teste E2E `e2e/tests/app-shell.spec.ts`: `/` redireciona para `/municipalities`, menu indica "Busca de cidades", rodapé mostra a fonte, `/api/health` responde

**Checkpoint**: fundação pronta. **Próximo passo: implementar a feature 003 inteira** ([specs/003-bot-protection/tasks.md](../003-bot-protection/tasks.md)) antes da fase 3.

---

## Phase 3: User Story 1 - Encontrar um município pelo nome (Priority: P1) 🎯 MVP

**Goal**: autocomplete de municípios por início de palavra, sem acento, "Nome/SIGLA", até 10 sugestões.

**Independent Test**: cenários 1 a 7 da US1 da spec; quickstart cenários 1 a 6 e 11.

**Pré-requisito**: fases 1 e 2 e a feature 003 concluídas.

### Tests for User Story 1

- [X] T047 [P] [US1] Teste unitário `backend/test/unit/domain/municipality-code.vo.test.ts`: exatamente 7 dígitos e os 2 primeiros formando um `StateCode` válido; `.`, letras e tamanhos errados são inválidos
- [X] T048 [P] [US1] Teste unitário `backend/test/unit/domain/search-term.vo.test.ts`: remove espaços das pontas e colapsa espaços internos; aceita de 2 a 60 caracteres; `normalized` sem diacríticos e em minúsculas; usa `test/shared/text-search.cases.json`
- [X] T049 [P] [US1] Teste unitário `backend/test/unit/application/search-municipalities.handler.test.ts` com reader falso: converte a entrada em `SearchTerm`, repassa limite 10, propaga `InvalidSearchTermError`
- [X] T050 [P] [US1] Teste de integração `backend/test/integration/infra/in-memory-municipality-search.reader.test.ts` contra o banco de teste: início de palavra com espaço, hífen e apóstrofo (`arco` → Pau D'Arco); nomes que começam com o termo antes dos demais; ordem alfabética pt-BR; homônimos ordenados pela sigla (Bom Jesus/PB antes de Bom Jesus/PI); no máximo 10; registro `.` nunca aparece
- [X] T051 [P] [US1] Teste de integração `backend/test/integration/http/municipality-suggestions.test.ts` com `fastify.inject()` e sessão obtida pelo helper da 003: `200` com `items` no formato do contrato; `items: []` sem resultado; `400 INVALID_SEARCH_TERM` para `q` ausente, com 1 caractere ou com mais de 60; `401 SESSION_REQUIRED` sem sessão
- [X] T052 [P] [US1] Teste unitário `frontend/test/unit/pages/municipality-search/suggestions.test.ts`: consulta só com 2 a 60 caracteres após remover espaços (acima de 60, nenhuma consulta e nenhuma mensagem de erro); espera de 250 ms; descarta resposta de termo anterior (FR-022)
- [X] T053 [P] [US1] Teste de componente `frontend/test/unit/pages/municipality-search/municipality-combobox.test.ts`: "Nome/SIGLA"; setas percorrem; Enter sem destaque escolhe a primeira; Esc fecha; mensagem "Nenhum município encontrado para "xyz". Confira a grafia ou digite só o começo do nome."; indicador de carregamento na lista; falha ao buscar sugestões mostra "Não foi possível carregar os dados." com "Tentar de novo" sem perder o texto; campo desabilitado com explicação durante a verificação e o bloqueio da 003 (FR-023)
- [X] T054 [P] [US1] Teste E2E `e2e/tests/municipality-search.spec.ts`: quickstart cenários 1, 3, 5, 6 e 11; e, na stack `compose.e2e-protection.yaml`, `e2e/tests/protection/search-session-expiry.spec.ts`: a sessão expira durante a digitação e as sugestões aparecem sem apagar o texto (spec 003, US1 cenário 9)

### Implementation for User Story 1

- [X] T055 [P] [US1] Criar `packages/contracts/src/municipalities/search-municipalities.contract.ts` (`SearchMunicipalitiesQuery { q: string }`; `SearchMunicipalitiesResponse { items: { code, name, stateCode, stateAbbreviation }[] }`) e exportar no `index.ts`
- [X] T056 [P] [US1] Criar `backend/src/domain/errors/invalid-municipality-code.error.ts` (`INVALID_MUNICIPALITY_CODE`, 400) e `invalid-search-term.error.ts` (`INVALID_SEARCH_TERM`, 400)
- [X] T057 [P] [US1] Criar `backend/src/domain/value-objects/municipality-code.vo.ts` ("exatamente 7 dígitos; os 2 primeiros formam um `StateCode` válido") e `search-term.vo.ts` ("texto após remover espaços das pontas e colapsar espaços internos; 2 a 60 caracteres; expõe `normalized` (NFD sem diacríticos, minúsculas)")
- [X] T058 [US1] Criar `backend/src/application/queries/search-municipalities/municipality-search.reader.ts` (porta `search(term: SearchTerm, limit: number): Promise<MunicipalitySuggestion[]>`) e `search-municipalities.handler.ts`
- [X] T059 [US1] Criar `backend/src/infra/database/readers/in-memory-municipality-search.reader.ts`: carrega uma vez, na inicialização, `municipio` com nome (exclui `.`), guarda nome normalizado e posições de início de palavra (após espaço, hífen ou apóstrofo), ordena com `Intl.Collator('pt-BR')` e sigla da UF (research R1)
- [X] T060 [US1] Criar `backend/src/infra/http/routes/municipality.routes.ts` com `GET /api/municipalities/suggestions` usando o schema do contrato e registrar no `main.ts` (reader carregado antes de o servidor escutar)
- [ ] T061 [US1] Invocar a skill `frontend-design` e criar `frontend/src/pages/municipality-search/api/suggestions.ts` (`useMunicipalitySuggestions(term)` com vue-query, espera de 250 ms, habilitado só com 2 a 60 caracteres, só aplica a resposta do termo atual)
- [ ] T062 [US1] Criar `frontend/src/pages/municipality-search/ui/MunicipalityCombobox.vue` com o Combobox do shadcn-vue (Reka UI): rótulo "Município", "Nome/SIGLA", trecho digitado em peso 600, anúncio da quantidade de sugestões, estados de [design.md](design.md#estados) (inclusive carregamento das sugestões e falha com "Tentar de novo" sem perder o texto), e campo desabilitado com explicação enquanto o estado de proteção da 003 indicar verificação ou bloqueio (FR-023)
- [ ] T063 [US1] Criar `frontend/src/pages/municipality-search/model/use-selected-municipality.ts` (código na URL `/municipalities/:municipalityCode`; toda escolha usa `router.replace`, para o botão voltar levar à página visitada antes da busca, FR-025) e `frontend/src/pages/municipality-search/ui/MunicipalitySearchPage.vue` com estado vazio e exemplos "Campinas, Bom Jesus, Paulo Afonso" que preenchem a busca; `index.ts` da página; ligar no router

**Checkpoint**: busca funcional e testada de ponta a ponta.

---

## Phase 4: User Story 2 - Ver os indicadores de um município (Priority: P1)

**Goal**: ficha do município com população, setores, área, densidade com escala, urbano/rural e sexo; endereço compartilhável.

**Independent Test**: cenários 1 a 7 da US2 da spec; quickstart cenários 7 a 10, 12 e 13.

### Tests for User Story 2

- [ ] T064 [P] [US2] Teste unitário `backend/test/unit/application/get-municipality-indicators.handler.test.ts` com reader falso: `MunicipalityCode` inválido → `InvalidMunicipalityCodeError`; reader retorna `null` → `MunicipalityNotFoundError`
- [ ] T065 [P] [US2] Teste de integração `backend/test/integration/infra/kysely-municipality-indicators.reader.test.ts` contra o banco de teste: invariantes de [data-model.md](data-model.md) (`men + women + unknown = population`, `unknown ≥ 0`, somas de `areaTypeBreakdown` iguais aos totais); `urban` e `rural` sempre presentes; `unclassified` só com setores sem classificação; registro `.` retorna `null`
- [ ] T066 [P] [US2] Teste de integração `backend/test/integration/http/municipality-indicators.test.ts`: `200` no formato do contrato; `400 INVALID_MUNICIPALITY_CODE` (`abc`, `123`, código com UF inexistente); `404 MUNICIPALITY_NOT_FOUND` (código válido inexistente); `401` sem sessão
- [ ] T067 [P] [US2] Teste unitário `frontend/test/unit/pages/municipality-search/municipality-record.test.ts`: percentuais de urbano/rural e sexo somam 100,0; "Sem classificação" e "Sem informação" só quando > 0; nota de "Sem informação"; texto equivalente das barras para leitor de tela
- [ ] T068 [P] [US2] Teste unitário `frontend/test/unit/shared/density-scale.test.ts`: posição logarítmica de 0,1 a 100.000; valores extremos 0,15 e 13.417; marcas 1, 10, 100, 1.000, 10.000
- [ ] T069 [P] [US2] Teste E2E `e2e/tests/municipality-indicators.spec.ts`: quickstart cenários 7, 8, 9, 10, 12 e 13; troca de município substitui a ficha (FR-014); voltar do navegador após duas escolhas leva à página anterior à busca (FR-025); SC-004 comparando a ficha de uma amostra (capitais, homônimo, município com setores sem classificação e com população sem informação de sexo) com a consulta direta em `e2e/.tmp/censo.sqlite`

### Implementation for User Story 2

- [ ] T070 [P] [US2] Criar `packages/contracts/src/municipalities/get-municipality-indicators.contract.ts` conforme [contracts/api.md](contracts/api.md) e exportar
- [ ] T071 [P] [US2] Criar `backend/src/domain/value-objects/area-type.vo.ts` (`'urban' | 'rural' | 'unclassified'` como objeto `as const`, sem `enum`) e `backend/src/domain/errors/municipality-not-found.error.ts` (`MUNICIPALITY_NOT_FOUND`, 404)
- [ ] T072 [US2] Criar `backend/src/application/queries/get-municipality-indicators/municipality-indicators.reader.ts` (porta `findByCode(code: MunicipalityCode): Promise<MunicipalityIndicators | null>`) e `get-municipality-indicators.handler.ts`
- [ ] T073 [US2] Criar `backend/src/infra/database/readers/kysely-municipality-indicators.reader.ts`: filtra `setor` por `cd_setor >= :code AND cd_setor < :code+1 AND cd_mun = :code`, `LEFT JOIN demografia`, agrupa por `situacao` (`Urbana` → `urban`, `Rural` → `rural`, nulo → `unclassified`), soma `homens`/`mulheres` com nulo = 0, calcula `unknown` e densidade (research R2, R3)
- [ ] T074 [US2] Adicionar `GET /api/municipalities/:municipalityCode` em `backend/src/infra/http/routes/municipality.routes.ts` e registrar no `main.ts`
- [ ] T075 [P] [US2] Invocar a skill `frontend-design` e criar `frontend/src/shared/ui/density-scale/DensityScale.vue` (régua logarítmica 0,1–100.000, marcador que desliza uma vez, sem animação com `prefers-reduced-motion`, marca de referência opcional, variante `compact` para linhas de tabela, rótulo textual do valor) e `index.ts`
- [ ] T076 [P] [US2] Invocar a skill `frontend-design` e criar `frontend/src/shared/ui/proportion-bar/ProportionBar.vue` (segmentos coloridos com hachura diagonal para "sem dado", legenda escrita, texto equivalente para leitor de tela) e `index.ts`
- [ ] T077 [US2] Criar `frontend/src/pages/municipality-search/api/indicators.ts` (`useMunicipalityIndicators(code)`)
- [ ] T078 [US2] Invocar a skill `frontend-design` e criar `frontend/src/pages/municipality-search/ui/MunicipalityRecord.vue` (ficha de [design.md](design.md#estrutura-desktop--1024px): título "Nome/SIGLA" em largura expandida, População, Setores censitários, Área, Densidade com `DensityScale`, Urbano e rural com duas `ProportionBar` (setores e população), Sexo com `ProportionBar` e nota; estados de carregamento estático e erro com "Tentar de novo")
- [ ] T079 [US2] Integrar a ficha em `MunicipalitySearchPage.vue`: carregar pelo código da URL, endereço inválido (FR-018) mostra busca vazia com a mensagem do contrato, foco programático no título ao carregar, `setDocumentTitle("Nome/SIGLA")` (FR-026)

**Checkpoint**: feature 001 completa.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T080 [P] Medir SC-002 e SC-003 na stack de produção local (sugestões e indicadores em até 1 s) e SC-001 (25 das 27 capitais com até 5 caracteres) com um teste E2E `e2e/tests/capitals.spec.ts`
- [ ] T081 [P] Revisar a tela em 360px, só com teclado e com leitor de tela, e corrigir o que falhar (FR-016)
- [ ] T082 Rodar `npm run lint`, `npm run format:check`, todos os testes e o quickstart manual ([quickstart.md](quickstart.md)); registrar desvios em `.harness/` se houver

---

## Dependencies & Execution Order

- **Fase 1 → Fase 2**: sequenciais; dentro delas, as tarefas marcadas [P] podem rodar em paralelo.
- **Fase 2 → feature 003**: a 003 depende da fundação.
- **Feature 003 → Fase 3**: as rotas e os testes desta feature usam a sessão da 003.
- **Fase 3 (US1) → Fase 4 (US2)**: a US2 reusa a página e o seletor da US1.
- **Fase 4 → feature 002**: a 002 reusa `DensityScale`, formatação, menu e cliente HTTP.
- Dentro de cada story: testes primeiro (devem falhar), depois contratos, domínio, aplicação, infra, rotas e interface.

## Parallel Example: User Story 1

```text
T047, T048, T049, T050, T051, T052, T053, T054   (testes, arquivos diferentes)
T055, T056, T057                                 (contrato, erros, VOs)
```

## Implementation Strategy

1. Fases 1 e 2 (fundação) → validar com T046.
2. Feature 003 inteira.
3. US1 → validar a busca de ponta a ponta (MVP da tela).
4. US2 → validar a ficha e o SC-004.
5. Polish.
6. Feature 002.
