# Implementation Plan: Ranking por estado

**Branch**: `002-state-ranking` (sem branch; trabalho direto na `main`) | **Date**: 2026-09-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-state-ranking/spec.md`

## Summary

Tela "Busca por estado": seleção entre as 27 UFs, totais da UF (população,
área incluindo áreas fora de municípios, densidade) e ranking de todos os
municípios por densidade decrescente, com filtro por nome que preserva a
posição, endereço compartilhável e o menu fixo da 001.

Abordagem técnica: agregação por intervalo da chave primária de `setor` com o
prefixo da UF (sem índice novo), ordenação pt-BR no reader, filtro no
frontend sobre as linhas carregadas, reuso da fundação e dos componentes da
001.

## Technical Context

**Language/Version**: TypeScript 6.0.3 sobre Node.js 24.21.0 LTS

**Primary Dependencies**: as mesmas da [001](../001-municipality-search/plan.md); nenhuma dependência nova

**Storage**: SQLite `censo.sqlite` na raiz, somente leitura

**Testing**: Vitest 5.0.2, @vue/test-utils 2.5.1, Playwright 1.63.0

**Target Platform**: Docker Compose local, navegadores atuais

**Project Type**: aplicação web (monorepo)

**Performance Goals**: ranking e totais em até 1 s (SC-001); medido: ranking de MG ~15 ms, de SP ~32 ms, totais ~2 ms ([research.md](research.md))

**Constraints**: somente leitura; filtro sem requisições; textos pt-BR; código e rotas em inglês

**Scale/Scope**: 27 UFs, até 853 linhas por ranking; 1 tela, 2 rotas de API

## Constitution Check

*GATE: verificado antes da fase 0 e novamente após a fase 1.*

| Princípio | Verificação | Situação |
|---|---|---|
| I. Documentação antes do código | Spec clarificada; plano sem código | ✅ |
| II. Somente leitura | Mesma conexão `readonly` da fundação; nenhuma escrita | ✅ |
| III. Arquitetura e fronteiras | 2 Queries com readers próprios (ADR 0012); página `pages/state-ranking`; reuso de `shared` e `widgets/app-header` | ✅ |
| IV. Contrato único | 2 rotas com schemas em `@censo/contracts` ([contracts/api.md](contracts/api.md)) | ✅ |
| V. Testes por camada | Unitário, integração e E2E definidos ([quickstart.md](quickstart.md)) | ✅ |
| VI. Idioma | Rotas `/api/states/...` e `/states/...`; textos pt-BR | ✅ |
| VII. Versões estáveis | Nenhuma dependência nova | ✅ |
| VIII. Docker | Usa a fundação da 001 | ✅ |
| IX. Design | [design.md](design.md) com o sistema visual da skill `frontend-design` | ✅ |

Nenhuma violação. Pós-fase 1: mantido.

**Ponto de atenção registrado** (não é violação): a regra de busca por início
de palavra passa a existir no backend (`SearchTerm`) e no frontend
(`text-search`), com tabela de casos de teste compartilhada (research R4).

Índices iniciais: **nenhum** (research R1).

## Project Structure

### Documentation (this feature)

```text
specs/002-state-ranking/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── design.md
├── quickstart.md
├── contracts/api.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks (ainda não criado)
```

### Source Code (repository root)

Apenas o que esta feature adiciona à fundação da 001.

```text
packages/contracts/src/states/
├── list-states.contract.ts
└── get-state-density-ranking.contract.ts

test/shared/text-search.cases.json       # casos de busca usados por backend e frontend

backend/src/
├── application/queries/
│   ├── list-states/
│   │   ├── list-states.handler.ts
│   │   └── states.reader.ts
│   └── get-state-density-ranking/
│       ├── get-state-density-ranking.handler.ts
│       └── state-ranking.reader.ts
└── infra/
    ├── database/readers/
    │   ├── kysely-states.reader.ts
    │   └── kysely-state-ranking.reader.ts
    └── http/routes/state.routes.ts

frontend/src/
├── pages/state-ranking/
│   ├── index.ts
│   ├── ui/                  # StateRankingPage, StateSelect, StateRecord, RankingTable
│   ├── model/               # use-selected-state (URL), use-ranking-filter
│   └── api/                 # useStates, useStateDensityRanking
└── shared/lib/text-search.ts
```

**Structure Decision**: mesma estrutura da 001. A API de UFs e de ranking
fica na página (só ela usa). `DensityScale`, formatação e menu vêm de
`shared` e `widgets` (criados na 001).

## Complexity Tracking

Nenhuma violação da constituição a justificar.
