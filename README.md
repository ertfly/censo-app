# censo-app

Consulta aos dados agregados do Censo Demográfico 2022 (IBGE), a partir do
banco `censo.sqlite` recebido pronto. Duas telas, somente leitura:

- **Busca de cidades** (`/municipalities`): autocomplete de município e ficha
  com população, setores censitários, área, densidade (com escala
  logarítmica), divisão urbano/rural e distribuição por sexo.
- **Busca por estado** (`/states`): totais da UF e ranking dos municípios por
  densidade, com filtro por nome.

As duas telas são protegidas contra bots sem cadastro e sem serviços de
terceiros (verificação automática por prova de trabalho e limite de
consultas).

## Instalação e execução

### Pré-requisitos

- Docker com Compose v2.
- Git com [Git LFS](https://git-lfs.com): o `censo.sqlite` é versionado no LFS.

Nada mais precisa estar instalado no host: Node, dependências, testes e lint
rodam em containers.

### Preparar

```bash
git lfs install
git clone <url-do-repositorio> censo-app
cd censo-app
git lfs pull                 # garante o censo.sqlite real, não o ponteiro de texto
cp .env.example .env
```

No `.env`, preencha os três segredos obrigatórios (sem eles o backend não
sobe), cada um diferente e com pelo menos 32 caracteres:

```bash
openssl rand -hex 32         # rode três vezes: ALTCHA_HMAC_KEY, SESSION_SECRET, PROTECTION_LOG_KEY
```

### Produção local

```bash
docker compose up --build
```

Acesse **http://localhost:8080** (porta em `APP_PORT`). Use `localhost`: a
verificação contra bots usa a Web Crypto do navegador, que só funciona em
contexto seguro (HTTPS ou `localhost`), ver [ADR 0023](.harness/decisions/0023-v1-somente-localhost.md).

### Desenvolvimento (com recarga automática)

```bash
docker compose -f compose.dev.yaml up
```

Frontend (Vite, HMR) em **http://localhost:5173**; backend (tsx watch) em
`localhost:3000`.

### Testes, lint e formatação

Os comandos rodam no serviço `deps` da stack de desenvolvimento:

```bash
docker compose -f compose.dev.yaml run --rm deps npm run lint
docker compose -f compose.dev.yaml run --rm deps npm run format:check
docker compose -f compose.dev.yaml run --rm deps npm run typecheck
docker compose -f compose.dev.yaml run --rm deps npm test      # unitários e integração
./e2e/scripts/run.sh                                            # E2E (Playwright) nas duas stacks
```

O E2E sobe a aplicação com as imagens de produção sobre uma cópia do banco
(`e2e/.tmp/censo.sqlite`), roda a suíte geral e a de proteção (limite de
consultas e expiração de sessão) e, no fim, confere o relatório de proteção e
a ausência de endereços IP nos logs. Nenhum teste usa o `censo.sqlite` da raiz.

### Relatório de proteção

```bash
docker compose exec backend npm run protection:report
```

Bloqueios e falhas de verificação por dia, sem endereço de rede, dos últimos
7 dias.

## Estrutura implementada

```
censo-app/
├── censo.sqlite                 # banco (Git LFS), na raiz por requisito
├── docs/user-stories.md         # histórias de usuário da v1
├── .harness/                    # arquitetura e decisões técnicas (ADRs 0001-0023)
├── .specify/                    # spec-kit: constituição, templates, scripts
├── .claude/skills/              # comandos /speckit-* usados no Claude Code
├── specs/
│   ├── 001-municipality-search/ # spec, plan, research, data-model, design, contracts, tasks...
│   ├── 002-state-ranking/
│   └── 003-bot-protection/
├── packages/contracts/          # @censo/contracts: schemas TypeBox da API
├── backend/                     # @censo/backend: Fastify + Kysely
│   ├── src/domain/              # Value Objects e erros de domínio
│   ├── src/application/         # QueryHandlers e portas de leitura
│   ├── src/infra/               # database (readers, migrations), http (rotas, proteção), logging, config
│   ├── src/main.ts              # composition root
│   └── test/                    # unit, integration, fixtures
├── frontend/                    # @censo/frontend: Vue 3 + Vite
│   ├── src/app/                 # router, tema, layout
│   ├── src/pages/               # municipality-search, state-ranking
│   ├── src/widgets/app-header/  # menu fixo, status da verificação, avisos
│   └── src/shared/              # api (cliente HTTP e sessão), lib (formatação pt-BR, busca), ui
├── e2e/                         # @censo/e2e: Playwright e scripts da stack de teste
├── test/shared/                 # casos de busca compartilhados entre backend e frontend
├── compose.yaml                 # produção
├── compose.dev.yaml             # desenvolvimento
└── compose.e2e*.yaml            # stacks de E2E
```

Fluxo em produção: navegador → nginx (arquivos do Vue e proxy de `/api`) →
backend Node/Fastify → `censo.sqlite` montado somente leitura. Só o nginx
publica porta no host.

## Padrões de arquitetura

### Backend

DDD simplificado com CQRS apenas de leitura ([ADR 0008](.harness/decisions/0008-arquitetura-backend.md),
[ADR 0012](.harness/decisions/0012-comunicacao-entre-consultas-e-contextos.md)):

| Camada | Conteúdo | Pode importar |
|---|---|---|
| `domain` | Value Objects (`StateCode`, `MunicipalityCode`, `SearchTerm`, `AreaType`) e erros com `code` e `kind` | só `domain` |
| `application` | Um QueryHandler por consulta; portas de leitura (interfaces) | `domain`, `typebox`, `@censo/contracts` |
| `infra` | Readers Kysely, índice de busca em memória, rotas Fastify, proteção, logs | tudo |
| `main.ts` | Composition root com injeção de dependência manual | tudo |

- **DTOs** são os schemas TypeBox de `@censo/contracts`: validam a entrada e a
  saída no Fastify e tipam backend e frontend. Mudar o contrato quebra a
  compilação das duas pontas.
- **Value Objects** validam a entrada no handler (ex.: `StateCode.create('35')`);
  erros de domínio viram respostas HTTP com código em inglês
  (`kind: 'invalid'` → 400, `'not_found'` → 404).
- **Readers** traduzem o banco (tabelas e colunas em português, restritas a
  `infra/database`) para os modelos de leitura em inglês. Query não chama
  Query; cada consulta tem seu reader.
- As fronteiras são verificadas no lint com `eslint-plugin-boundaries`.
- Reservado para quando houver escrita: entidades, repositórios e Commands.

### Frontend

Feature-Sliced Design enxuto ([ADR 0014](.harness/decisions/0014-arquitetura-frontend.md)):
`app` → `pages` → `widgets` → `shared`, importando só para baixo e pela API
pública (`index.ts`) de cada slice. Dados do servidor com `@tanstack/vue-query`;
o cliente HTTP (`shared/api`) espera a verificação, refaz a sessão expirada e
trata o bloqueio por excesso de consultas.

## Decisões técnicas e por quê

Todas registradas como ADR em [.harness/decisions/](.harness/decisions/); as
principais:

| Decisão | Por quê | ADR |
|---|---|---|
| Node.js 24 LTS + Fastify + TypeScript | Um só idioma nas duas pontas; Fastify valida e serializa por schema | [0002](.harness/decisions/0002-runtime-e-backend.md) |
| TypeScript 6.0.3 (não o 7) | O typescript-eslint ainda não suporta o 7 | [0010](.harness/decisions/0010-typescript-6.md) |
| Vue 3 (Composition API) + Tailwind + shadcn-vue/Reka UI | Componentes acessíveis que ficam no código do projeto, com o visual próprio definido no [design-system](.harness/design-system.md) | [0003](.harness/decisions/0003-frontend-vue.md), [0004](.harness/decisions/0004-ui-tailwind-shadcn-vue.md) |
| Kysely + better-sqlite3 | SQL tipado sem ORM, adequado a consultas de agregação; migrations do próprio Kysely | [0006](.harness/decisions/0006-acesso-a-dados.md), [0015](.harness/decisions/0015-migrations.md) |
| Somente leitura na v1 | O requisito é consultar; escrita fica em aberto | [0007](.harness/decisions/0007-primeira-versao-somente-leitura.md) |
| Monorepo com pacote de contratos | Um schema por rota, compartilhado por backend e frontend | [0013](.harness/decisions/0013-organizacao-do-repositorio.md) |
| Docker Compose, um comando | A máquina precisa só de Docker; nginx serve o frontend e faz proxy da API na mesma origem | [0005](.harness/decisions/0005-docker-compose.md) |
| Banco na raiz, via Git LFS, aberto somente leitura | Requisito do projeto; o arquivo binário não incha o histórico | [0018](.harness/decisions/0018-banco-na-raiz.md) |
| Busca de município com índice em memória | O `LIKE` do SQLite não ignora acentos; os 5.570 nomes cabem em memória e a busca responde em milissegundos | research R1 da [001](specs/001-municipality-search/research.md) |
| Agregações pelo intervalo da chave primária | O código do setor começa pelo da UF e do município: a consulta usa a chave primária sem índice novo | research R2 da 001 e da 002 |
| Percentuais pelo maior resto | As partes somam sempre 100,0% | research R4 da 001 |
| Proteção com ALTCHA local + sessão em cookie + limite próprio | Sem terceiros e sem cadastro; o limite próprio conta todas as rotas `/api`, inclusive as desconhecidas | [0017](.harness/decisions/0017-protecao-contra-bots.md), [0022](.harness/decisions/0022-limite-de-consultas-proprio.md) |
| Logs de proteção sem IP, com identificador embaralhado, por 7 dias | Permite investigar abusos sem guardar endereço de rede | [0019](.harness/decisions/0019-registros-de-protecao.md) |
| Acesso só por `localhost` na v1 | A Web Crypto exige contexto seguro; rede interna e internet exigem HTTPS, a decidir | [0016](.harness/decisions/0016-execucao-local.md), [0023](.harness/decisions/0023-v1-somente-localhost.md) |
| E2E em Docker com a proteção ligada | Não existe modo que desligue a proteção; o teste roda como o uso real | [0009](.harness/decisions/0009-testes.md), [0020](.harness/decisions/0020-stacks-de-e2e.md) |
| Estágio de compilação para o better-sqlite3 | O driver não tem binário pronto para a combinação usada; a imagem final fica sem compiladores | [0021](.harness/decisions/0021-compilacao-do-driver-sqlite.md) |
| Só versões estáveis, fixadas exatamente | Builds reproduzíveis | [stack.md](.harness/stack.md) |

## O que eu faria diferente com mais tempo

- **HTTPS e publicação**: a v1 só funciona por `localhost`. Acesso pela rede
  interna ou pela internet exige HTTPS, domínio e revisão da proteção, num ADR
  próprio.
- **Estado da proteção fora do processo**: sessões usadas, contadores e
  bloqueios ficam em memória, o que limita a aplicação a uma instância. Com
  mais instâncias, iriam para um armazenamento compartilhado.
- **Ranking com lista virtualizada**: Minas Gerais (853 linhas) aparece entre
  0,5 e 0,8 s, dentro da meta de 1 s mas perto dela; a API responde em cerca de
  30 ms e o resto é a montagem das linhas no navegador.
- **Uma só implementação da busca por nome**: a regra (sem acento, início de
  palavra) existe no `SearchTerm` do backend e em `shared/lib/text-search` do
  frontend, amarradas pela mesma tabela de casos (`test/shared`). Um pacote
  compartilhado eliminaria a duplicação.
- **CI**: lint, testes e E2E rodam por scripts locais; faltou um pipeline que
  rode tudo a cada push.
- **Acessibilidade com leitores de tela reais**: a revisão foi feita pela
  árvore de acessibilidade e por teclado; faltou testar com NVDA e VoiceOver.
- **Testes de regressão visual**: as telas foram conferidas por capturas de
  tela durante o desenvolvimento, sem comparação automática.
- **Registro "." do RS**: hoje entra só na área total da UF; o tratamento
  definitivo depende de decisão do responsável pelo produto.

## Metodologia de IA

O projeto foi construído com o **Claude Code** seguindo o
[spec-kit](https://github.com/github/spec-kit) (Spec-Driven Development): 100%
da documentação antes do código, e o código derivado das specs, que por sua
vez derivam das histórias de usuário.

Passos seguidos:

1. **Regras do processo** guardadas na memória do Claude Code (ver abaixo).
2. **`.harness/`**: arquitetura, stack, convenções, mapeamento do banco,
   índices, sistema visual e 23 ADRs, discutidos antes de cada decisão.
3. **Constituição** do spec-kit (`.specify/memory/constitution.md`) derivada
   do `.harness/`.
4. **Histórias de usuário** em [docs/user-stories.md](docs/user-stories.md).
5. Para cada funcionalidade (001, 002, 003), os comandos do spec-kit:
   `/speckit-specify` → `/speckit-clarify` (perguntas respondidas pelo
   responsável) → `/speckit-plan` (research, data-model, contracts,
   quickstart e design) → `/speckit-checklist` → `/speckit-tasks` →
   `/speckit-analyze` (consistência entre spec, plano e tarefas).
6. **Implementação** com `/speckit-implement`, na ordem fundação → 003 → 001
   → 002: testes primeiro (TDD), depois o código, com um commit por tarefa
   direto na `main`.
7. **Design**: toda ação no frontend usou a skill `frontend-design`; o visual
   foi conferido por capturas de tela (desktop e 360px) e corrigido quando
   necessário.
8. **Validação** ao fim de cada bloco: lint, formatação, tipos, testes
   unitários e de integração, E2E nas stacks Docker e registro das medições
   no `quickstart.md` de cada feature.

Os desvios encontrados durante a implementação viraram ADRs (ex.: 0021, 0022,
0023) ou registros no `quickstart.md`, e os erros foram corrigidos em commits
separados, sem reescrever o histórico.

## Memória do Claude Code criada para o projeto

A memória guarda só regras de processo; decisões técnicas ficam no
`.harness/`.

| Memória | Regra |
|---|---|
| commit-message-format | Conventional Commits sem escopo (`feat: ...`), no máximo 72 caracteres, uma linha, sem `Co-Authored-By` |
| small-frequent-commits | Commits pequenos e frequentes, um por passo; nunca squash |
| main-only-workflow | Tudo direto na `main`, sem branches por enquanto |
| spec-kit-methodology | spec-kit, 100% da documentação antes do código, specs a partir das histórias de usuário |
| harness-folder | `.harness/` para arquitetura e decisões técnicas; memória só para processo |
| direct-alignment | Apontar sem eufemismo qualquer pedido que saia dos padrões combinados |
| frontend-design-skill | Usar a skill `frontend-design` em toda ação de frontend |
| stable-versions | Só versões estáveis (tag `latest` do npm, Node LTS) |

## Modelo usado

**Claude Opus 5.5** (`claude-opus-5-5`), no Claude Code.
