# 0009. Estratégia de testes automatizados

- Status: Aceito
- Data: 2026-09-25

## Contexto

Backend e frontend têm testes automatizados: E2E para as funcionalidades
gerais e testes unitários para Value Objects e Queries (CQRS). A arquitetura
do backend está no [ADR 0008](0008-arquitetura-backend.md) e a primeira versão
é somente leitura ([ADR 0007](0007-primeira-versao-somente-leitura.md)).

Testes unitários de handlers usam portas falsas; por isso não executam o
código de `infra`. Consultas cuja lógica é o próprio SQL só são verificadas
contra um banco real.

## Decisão

### Ferramentas

| Uso | Ferramenta | Versão |
|---|---|---|
| Unitários e integração (backend e frontend) | Vitest | 5.0.2 |
| Componentes e composables Vue | @vue/test-utils | 2.5.1 |
| E2E | Playwright (`@playwright/test`) | 1.63.0 |

### O que é testado em cada nível

| Camada | Tipo | Dependências no teste |
|---|---|---|
| Value Objects | Unitário | Nenhuma |
| QueryHandlers | Unitário | Porta de leitura falsa, em memória |
| Readers Kysely (`infra/database`) | Integração | SQLite em memória com dados de teste |
| Rotas HTTP | Integração | `fastify.inject()` + SQLite em memória |
| Frontend: composables e stores | Unitário | API simulada |
| Fluxos completos | E2E | Stack completa no Docker |

- Quando a escrita for adotada: entidades e UseCases (Commands) com testes
  unitários usando Repositories falsos; Repositories Kysely com testes de
  integração.
- No frontend, componentes puramente visuais não têm teste unitário; o
  comportamento de tela é coberto pelo E2E.

### Dados de teste

- **Nenhum teste usa `data/censo.sqlite`.**
- Integração: banco SQLite em memória, criado pelas mesmas migrations da
  aplicação e populado com um conjunto pequeno de dados de teste versionado no
  repositório.
- E2E: a stack sobe com uma cópia do banco, nunca com o arquivo versionado.
- Os dados de teste incluem os casos de borda levantados em
  [database.md](../database.md#qualidade-dos-dados): município `.`, setor sem
  situação, setor sem demografia, demografia com valores nulos, nomes de
  município repetidos.

### Execução

- Todos os testes rodam dentro de containers, sem Node no host
  ([ADR 0005](0005-docker-compose.md)). Os comandos exatos são definidos na
  montagem do projeto.

## Alternativas consideradas

- **Jest:** exige configuração extra para TypeScript e ESM; o Vitest usa a
  mesma base do Vite do frontend.
- **Node test runner (`node:test`):** sem integração com Vue e com menos
  recursos de mock; teria que conviver com outra ferramenta no frontend.
- **Cypress para E2E:** Playwright cobre múltiplos navegadores e roda bem em
  container.
- **Testar readers com banco falso:** não verifica o SQL, que é a lógica
  desses componentes.

## Consequências

- Uma ferramenta de testes (Vitest) para backend e frontend.
- A pirâmide cobre domínio, aplicação e infra; nenhuma camada fica testada
  apenas indiretamente.
- O conjunto de dados de teste precisa ser mantido junto com as migrations.
- Metas de cobertura e integração contínua ficam para decisão futura.
