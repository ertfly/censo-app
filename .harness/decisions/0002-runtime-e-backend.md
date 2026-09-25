# 0002. Runtime Node.js LTS com TypeScript e backend em Fastify

- Status: Aceito (versão do TypeScript revista pelo [ADR 0010](0010-typescript-6.md))
- Data: 2026-09-25

## Contexto

O censo-app é uma aplicação web acessada pelo navegador, com backend que lê e
escreve no banco SQLite definido no [ADR 0001](0001-banco-de-dados-sqlite.md).
O projeto usa somente versões estáveis. O frontend também será em TypeScript
([ADR 0003](0003-frontend-vue.md)), então uma linguagem única serve às duas
pontas.

## Decisão

| Item | Escolha | Versão |
|---|---|---|
| Runtime | Node.js LTS "Krypton" | 24.21.0 |
| Linguagem | TypeScript | 7.0.2 |
| Framework HTTP | Fastify | 5.12.5 |

- A versão do Node é fixada no repositório (`mise.toml` ou `.nvmrc`).
- A compatibilidade do TypeScript 7 com o ferramental (em especial o
  `vue-tsc`) é validada na montagem do projeto. Se falhar, adota-se a última
  versão 6.x estável, registrada em novo ADR.

## Alternativas consideradas

- **Node.js 26:** é a linha "Current", ainda não LTS. Fere a regra de versões
  estáveis.
- **Hono:** mais leve e multi-runtime, mas o projeto roda só em Node e não
  precisa dessa portabilidade.
- **Express:** amplamente conhecido, mas sem validação de schema nem tipagem
  de rotas embutidas.
- **Go, Python ou Java:** descartados para manter uma única linguagem entre
  backend e frontend.

## Consequências

- Uma linguagem só (TypeScript) no projeto inteiro; tipos podem ser
  compartilhados entre backend e frontend.
- Fastify traz validação de entrada e saída via JSON Schema e bom desempenho.
- A forma de acesso ao SQLite (driver, query builder ou ORM, migrations) fica
  para um ADR próprio.
- Ambiente de execução (máquina local, rede interna ou container) ainda não
  definido.
