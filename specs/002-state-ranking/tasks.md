---
description: "Tarefas da feature 002 (Ranking por estado)"
---

# Tasks: Ranking por estado

**Input**: `specs/002-state-ranking/` (plan.md, spec.md, research.md, data-model.md, contracts/api.md, design.md, quickstart.md)

**Prerequisites**: fundação (fases 1 e 2 da [001](../001-municipality-search/tasks.md)), feature [003](../003-bot-protection/tasks.md) e feature 001 concluídas.

**Tests**: obrigatórios por camada (Princípio V). Os E2E rodam na stack `compose.e2e.yaml` ([ADR 0020](../../.harness/decisions/0020-stacks-de-e2e.md)). Testes de rota e E2E obtêm sessão com os helpers da 003 (`backend/test/helpers/create-session.ts`, `e2e/helpers/api-session.ts`).

**Reuso**: `StateCode`, `DensityScale`, `format.ts`, `document-title.ts`, `app-header`, `http-client`, `create-test-database.ts` e o fixture de dados de teste.

## Regras de execução

Mesmas da [001](../001-municipality-search/tasks.md#regras-de-execução).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo
- **[Story]**: US1 (ranking) ou US2 (totais da UF)

---

## Phase 1: Setup

- [X] T001 Ampliar `backend/test/fixtures/census.fixture.ts` com uma UF de ranking (código 31) contendo: dois municípios de teste com densidade exatamente igual, "Água Boa" e "Aguaí", que pela regra do português ficam nessa ordem (na comparação binária a ordem se inverte); um município urbano muito denso e um rural pouco denso; e confirmar que o fixture já tem DF com um único município e o registro `.` do RS com área

---

## Phase 2: Foundational (backend e contratos das duas stories)

**Purpose**: a mesma rota entrega ranking (US1) e totais (US2); o backend completo vem antes das telas.

### Tests

- [X] T002 [P] Teste unitário `backend/test/unit/application/list-states.handler.test.ts` com reader falso: repassa a lista
- [X] T003 [P] Teste unitário `backend/test/unit/application/get-state-density-ranking.handler.test.ts` com reader falso: código fora do formato ou fora dos 27 → `InvalidStateCodeError`
- [X] T004 [P] Teste de integração `backend/test/integration/infra/kysely-states.reader.test.ts`: UFs com `code`, `abbreviation` e `name`, ordenadas pelo nome com a regra pt-BR
- [X] T005 [P] Teste de integração `backend/test/integration/infra/kysely-state-ranking.reader.test.ts`: invariantes de [data-model.md](data-model.md) ("soma de `items[].population` = `totals.population`"; "soma de `items[].areaKm2` + `areaOutsideMunicipalitiesKm2` = `totals.areaKm2`"; "`position` sem repetição nem lacuna"); densidade decrescente; empate exato ordenado pelo nome pt-BR; registro `.` fora de `items` e com área em `totals` e em `areaOutsideMunicipalitiesKm2`; DF com um item; `areaOutsideMunicipalitiesKm2 = 0` nas UFs sem o registro `.`
- [X] T006 [P] Teste de integração `backend/test/integration/http/states.test.ts` com `fastify.inject()` e sessão: `GET /api/states` e `GET /api/states/:stateCode/density-ranking` no formato do contrato; `400 INVALID_STATE_CODE` para `99`, `abc` e `3`; `401 SESSION_REQUIRED` sem sessão

### Implementation

- [X] T007 [P] Criar `packages/contracts/src/states/list-states.contract.ts` (`{ items: { code, abbreviation, name }[] }`) e `get-state-density-ranking.contract.ts` (`state { code, abbreviation, name }`; `totals { population, areaKm2, populationDensity, areaOutsideMunicipalitiesKm2 }`; `items { position, code, name, population, areaKm2, populationDensity }[]`) conforme [contracts/api.md](contracts/api.md); exportar no `index.ts`
- [X] T008 [P] Criar `backend/src/application/queries/list-states/states.reader.ts` (porta `listAll(): Promise<StateSummary[]>`) e `list-states.handler.ts`
- [X] T009 [P] Criar `backend/src/application/queries/get-state-density-ranking/state-ranking.reader.ts` (porta `findByState(code: StateCode): Promise<StateRanking>`) e `get-state-density-ranking.handler.ts`
- [X] T010 Criar `backend/src/infra/database/readers/kysely-states.reader.ts`: lê `uf`, completa a sigla por `StateCode`, ordena com `Intl.Collator('pt-BR')`
- [X] T011 Criar `backend/src/infra/database/readers/kysely-state-ranking.reader.ts`: agrega `setor` por `cd_mun` com `cd_setor >= :uf AND cd_setor < :uf_seguinte`, junta `municipio` para o nome, separa o registro `.` (só entra em `totals` e em `areaOutsideMunicipalitiesKm2`), ordena em TypeScript por densidade decrescente e, em empate exato, pelo nome com `Intl.Collator('pt-BR')`, e atribui posições sequenciais (research R1, R2)
- [X] T012 Criar `backend/src/infra/http/routes/state.routes.ts` com `GET /api/states` e `GET /api/states/:stateCode/density-ranking` e registrar no `backend/src/main.ts`

**Checkpoint**: API da 002 pronta e testada.

---

## Phase 3: User Story 1 - Ver os municípios de uma UF ranqueados por densidade (Priority: P1) 🎯 MVP

**Goal**: seleção de UF, ranking completo com escala por linha, filtro por nome que preserva a posição, endereço compartilhável.

**Independent Test**: cenários 1 a 11 da US1 da spec; quickstart cenários 1 a 4 e 6 a 11.

### Tests for User Story 1

- [X] T013 [P] [US1] Teste unitário `frontend/test/unit/shared/text-search.test.ts` com os casos de `test/shared/text-search.cases.json` (mesma tabela usada pelo `SearchTerm` do backend)
- [X] T014 [P] [US1] Teste unitário `frontend/test/unit/pages/state-ranking/ranking-filter.test.ts`: filtra a partir do primeiro caractere; linhas mantêm a posição do ranking completo; contagem "853 municípios" e "3 de 853 municípios"; filtro limpo ao trocar de UF
- [X] T015 [P] [US1] Teste de componente `frontend/test/unit/pages/state-ranking/ranking-table.test.ts`: colunas Posição, Município, População, Área (km²), Densidade (hab/km²) e Escala; números no formato pt-BR; linha de referência da densidade da UF na escala; `<th scope="col">`; linhas sem ação de clique nem link (FR-010); mensagem "Nenhum município de Minas Gerais corresponde a "xyz"."
- [X] T016 [P] [US1] Teste de componente `frontend/test/unit/pages/state-ranking/state-select.test.ts`: 27 opções no formato "Nome/SIGLA" na ordem recebida; seleção por teclado com busca por digitação; seleção desabilitada com explicação durante a verificação e o bloqueio (FR-026)
- [X] T017 [P] [US1] Teste E2E `e2e/tests/state-ranking.spec.ts`: quickstart cenários 1, 2, 3, 4, 6, 7, 8, 9 e 10; cenário 11 da US1 da spec ("Águas Vermelhas" antes de "Luminárias" em MG)

### Implementation for User Story 1

- [X] T018 [P] [US1] Criar `frontend/src/shared/lib/text-search.ts`: normaliza (NFD sem diacríticos, minúsculas, espaços colapsados) e encontra o termo no início de qualquer palavra, com espaço, hífen e apóstrofo como separadores (research R4)
- [X] T019 [P] [US1] Criar `frontend/src/pages/state-ranking/api/states.ts` (`useStates()`) e `density-ranking.ts` (`useStateDensityRanking(code)`), com os tipos de `@censo/contracts`
- [X] T020 [US1] Criar `frontend/src/pages/state-ranking/model/use-selected-state.ts`: código na URL `/states/:stateCode`; toda escolha usa `router.replace`, como na 001 (FR-028); endereço inválido tratado pela resposta `INVALID_STATE_CODE`
- [X] T021 [US1] Criar `frontend/src/pages/state-ranking/model/use-ranking-filter.ts` (usa `text-search`, preserva posição, contagem, limpa ao trocar de UF)
- [X] T022 [US1] Invocar a skill `frontend-design` e criar `frontend/src/pages/state-ranking/ui/StateSelect.vue` com o Select do shadcn-vue (rótulo "Unidade federativa", opções "Nome/SIGLA")
- [X] T023 [US1] Invocar a skill `frontend-design` e criar `frontend/src/pages/state-ranking/ui/RankingTable.vue`: tabela semântica com cabeçalho fixo ao rolar, largura condensada e algarismos tabulares, coluna Escala com a variante `compact` de `DensityScale` e marca de referência da UF (decorativa para leitores de tela), layout de celular em duas linhas por item ([design.md](design.md#estrutura-celular--640px)), filtro "Filtrar municípios" com contagem anunciada a leitores de tela
- [X] T024 [US1] Criar `frontend/src/pages/state-ranking/ui/StateRankingPage.vue` e `index.ts`: orientação antes da escolha (FR-024), carregamento com rótulos e 10 linhas cinza estáticas (FR-025), erro com "Tentar de novo" sem perder UF e filtro (FR-014), volta ao início ao trocar de UF (FR-022), título da aba "Nome/SIGLA - Censo 2022" (FR-028), foco programático no título, seleção e filtro desabilitados com explicação enquanto o estado de proteção da 003 indicar verificação ou bloqueio (FR-026); substituir o placeholder de `/states` em `frontend/src/app/router.ts`

**Checkpoint**: ranking utilizável de ponta a ponta.

---

## Phase 4: User Story 2 - Ver os números agregados da UF (Priority: P1)

**Goal**: totais da UF (população, área, densidade) com escala e nota da área fora dos municípios.

**Independent Test**: cenários 1 a 4 da US2 da spec; quickstart cenário 5 e conferência dos números.

### Tests for User Story 2

- [X] T025 [P] [US2] Teste de componente `frontend/test/unit/pages/state-ranking/state-record.test.ts`: População, Área e Densidade no formato pt-BR; nota "Inclui 13.085,86 km² fora dos municípios, registrados sem município na base do Censo." só quando `areaOutsideMunicipalitiesKm2 > 0`; escala com o marcador da UF
- [ ] T026 [P] [US2] Teste E2E `e2e/tests/state-totals.spec.ts`: cenário 4 da US2 (RS) e, para as 27 UFs, totais e ordem do ranking comparados com as consultas diretas de [quickstart.md](quickstart.md#conferência-dos-números-sc-002-sc-003) em `e2e/.tmp/censo.sqlite` (SC-002, SC-003)

### Implementation for User Story 2

- [ ] T027 [US2] Invocar a skill `frontend-design` e criar `frontend/src/pages/state-ranking/ui/StateRecord.vue`: título "Nome/SIGLA" em largura expandida, ficha com População, Área e Densidade, `DensityScale` com o marcador da UF, nota da área fora dos municípios (FR-008)
- [ ] T028 [US2] Integrar `StateRecord.vue` em `StateRankingPage.vue`, acima do filtro e do ranking, com os mesmos estados de carregamento e erro

**Checkpoint**: feature 002 completa.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T029 [P] Medir SC-001 (ranking e totais de MG em até 1 s na stack local) e SC-004 (encontrar a posição de 5 municípios de MG escolhidos ao acaso usando o filtro, cada um em até 30 s) em `e2e/tests/state-ranking-performance.spec.ts`
- [ ] T030 [P] Revisar a tela em 360px, só com teclado e com leitor de tela, e corrigir o que falhar (FR-015)
- [ ] T031 Rodar lint, formatação, todos os testes das três features e os quickstarts manuais; registrar desvios em `.harness/` se houver

---

## Dependencies & Execution Order

- **Fundação, 003 e 001 → esta feature**.
- **Setup → Foundational → US1 → US2**: a US2 é exibida na mesma página da US1.
- Dentro de cada fase: testes primeiro (devem falhar), depois implementação.

## Parallel Example: Foundational

```text
T002, T003, T004, T005, T006   (testes)
T007, T008, T009               (contratos e portas)
```

## Implementation Strategy

1. Backend completo (fase 2).
2. US1: ranking com filtro e escala (MVP da tela).
3. US2: totais da UF.
4. Polish e validação final das três features.
