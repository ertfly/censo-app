# 0013. Monorepo com npm workspaces e pacote de contratos

- Status: Aceito
- Data: 2026-09-25
- Revisa: [ADR 0005](0005-docker-compose.md) (contexto de build),
  [ADR 0008](0008-arquitetura-backend.md) (local dos DTOs) e
  [ADR 0011](0011-lint-e-formatacao.md) (fronteiras)

## Contexto

Backend ([ADR 0002](0002-runtime-e-backend.md)) e frontend
([ADR 0003](0003-frontend-vue.md)) são TypeScript, mantidos pelo mesmo time no
mesmo repositório. O frontend é o único consumidor da API. Os tipos das
respostas precisam ser os mesmos nas duas pontas, e uma mudança de contrato
deve quebrar a compilação, não a aplicação em produção.

## Decisão

### Estrutura

```
censo-app/
├── package.json             # workspaces + scripts que orquestram tudo
├── package-lock.json        # lockfile único
├── tsconfig.base.json       # configuração TypeScript comum
├── eslint.config.js         # lint único
├── .prettierrc
├── .editorconfig
├── .dockerignore
├── compose.yaml
├── compose.dev.yaml
├── packages/
│   └── contracts/           # @censo/contracts
├── backend/                 # @censo/backend
└── frontend/                # @censo/frontend
```

- Gerenciador: npm workspaces (npm incluído no Node.js 24.21.0).
- Sem Turborepo, Nx ou pnpm.
- Um lockfile único: mesmas versões de ferramentas em todos os pacotes.
- Ordem de build por project references do TypeScript (`tsc -b`):
  `contracts` antes de `backend` e `frontend`.

### Pacote `@censo/contracts`

Contém apenas o formato dos dados que atravessam o HTTP.

```
packages/contracts/src/
├── index.ts
├── common/
│   └── error-response.ts
└── <recurso>/
    └── <nome-da-consulta>.contract.ts
```

- Um arquivo por consulta, com o schema de entrada e o de saída.
- Cada schema TypeBox é exportado como valor (`const`, usado em tempo de
  execução) e como tipo (`type`, derivado com `Static`), com o mesmo nome.
- Compilado com `tsc` para `dist/`; o Node.js não executa TypeScript de dentro
  de `node_modules`.

| Entra | Não entra |
|---|---|
| Schemas de entrada (params, query string) | Value Objects, entidades, regras de negócio |
| Schemas de resposta | Funções, classes, lógica |
| Códigos de erro da API | Nomes de tabela ou coluna em português |
| Restrições de formato (`pattern`, `minLength`) | Qualquer dependência além de `typebox` |

### Uso pelo backend

- Rotas (`infra/http`) usam os schemas para validar a entrada e serializar a
  resposta.
- QueryHandlers (`application`) recebem o DTO de entrada, convertem em Value
  Objects e devolvem o DTO de saída. O domínio nunca recebe um DTO.

### Uso pelo frontend

| Uso | Forma | Quando |
|---|---|---|
| Tipos | `import type` | Padrão; nada do pacote vai para o navegador |
| Schemas em execução | `import` + `Value.Check` do TypeBox | Só para validação de formulário como experiência do usuário |

- A validação com autoridade é sempre a do backend.
- O frontend não valida respostas da API em tempo de execução.

## Revisões

### ADR 0005: Docker

- O contexto de build dos Dockerfiles passa a ser a raiz do repositório
  (precisam do lockfile e de `packages/contracts`).
- `.dockerignore` na raiz exclui `node_modules`, `dist`, `.git`, `data` e
  documentação.
- Desenvolvimento: a raiz é montada no container; `node_modules` fica em
  volumes nomeados.

### ADR 0008: arquitetura do backend

- Os DTOs de entrada e saída saem de `application/queries/<query-name>/` e vão
  para `@censo/contracts`. Na pasta da Query ficam o handler e a interface de
  leitura.
- Correção: o ADR 0008 afirmava que a resposta é "validada pelo schema de
  saída". No Fastify, o schema de resposta é usado para **serializar** a
  resposta (gera o JSON e descarta campos fora do schema), não para validá-la.
  A garantia do formato vem da compilação: o type provider do TypeBox obriga o
  handler a devolver o tipo do contrato.

### ADR 0011: fronteiras de importação

| Origem | Pode importar |
|---|---|
| `packages/contracts` | Somente `typebox` |
| `backend` `application` | `domain`, `application`, `typebox`, `@censo/contracts` |
| `frontend` | `@censo/contracts` (tipos por padrão) |

## Alternativas consideradas

- **Pastas independentes com tipos duplicados à mão:** os tipos divergem e a
  quebra aparece em produção.
- **Contrato via OpenAPI gerado:** adequado para API com consumidores externos;
  aqui adiciona um passo de geração sem ganho, pois o único consumidor é o
  frontend do próprio repositório.
- **Domínio como pacote compartilhado:** espalharia regras de negócio pelo
  frontend e acoplaria as duas pontas.
- **DTO de aplicação separado do contrato HTTP:** em uma aplicação somente
  leitura, geraria duas definições iguais e uma conversão sem efeito. A
  separação pode ser feita em uma consulta específica se os formatos
  divergirem.

## Consequências

- Mudança de contrato quebra a compilação do backend e do frontend.
- Um passo de build a mais (`contracts`) antes dos demais pacotes.
- O pacote de contratos precisa de disciplina para não virar um "shared"
  genérico; as regras de conteúdo são verificadas em revisão e pelo lint de
  fronteiras.
