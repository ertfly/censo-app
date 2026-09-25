# Stack

> Status: definida

| Camada | Tecnologia | Versão | ADR |
|---|---|---|---|
| Runtime | Node.js LTS "Krypton" | 24.21.0 | [0002](decisions/0002-runtime-e-backend.md) |
| Linguagem | TypeScript | 6.0.3 | [0010](decisions/0010-typescript-6.md) |
| Backend | Fastify | 5.12.5 | [0002](decisions/0002-runtime-e-backend.md) |
| Frontend | Vue 3 (Composition API) | 3.5.43 | [0003](decisions/0003-frontend-vue.md) |
| Build | Vite | 8.3.1 | [0003](decisions/0003-frontend-vue.md) |
| Roteamento | Vue Router | 5.3.1 | [0003](decisions/0003-frontend-vue.md) |
| Estado do servidor | @tanstack/vue-query | 5.103.2 | [0014](decisions/0014-arquitetura-frontend.md) |
| Estado do cliente | Pinia (só se necessário) | 4.0.3 | [0014](decisions/0014-arquitetura-frontend.md) |
| Estilo | Tailwind CSS | 4.3.3 | [0004](decisions/0004-ui-tailwind-shadcn-vue.md) |
| Componentes | shadcn-vue + Reka UI | 2.8.2 / 2.10.5 | [0004](decisions/0004-ui-tailwind-shadcn-vue.md) |
| Utilitários dos componentes | clsx, tailwind-merge, class-variance-authority | 2.1.1 / 3.7.0 / 0.7.1 | [0004](decisions/0004-ui-tailwind-shadcn-vue.md) |
| Ícones | @lucide/vue | 1.48.0 | [0004](decisions/0004-ui-tailwind-shadcn-vue.md) |
| Composables utilitários | @vueuse/core | 14.4.0 (linha 14, a mesma usada pelo reka-ui) | [0004](decisions/0004-ui-tailwind-shadcn-vue.md) |
| Fonte | Archivo via @fontsource-variable/archivo (servida localmente) | 5.3.0 | [design-system.md](design-system.md) |
| Banco de dados | SQLite (`censo.sqlite`, na raiz) | 3 | [0001](decisions/0001-banco-de-dados-sqlite.md), [0018](decisions/0018-banco-na-raiz.md) |
| Repositório | Monorepo com npm workspaces | npm do Node 24.21.0 | [0013](decisions/0013-organizacao-do-repositorio.md) |
| Contratos da API | `@censo/contracts` (schemas TypeBox) | — | [0013](decisions/0013-organizacao-do-repositorio.md) |
| Validação e DTOs | TypeBox + `@fastify/type-provider-typebox` | 1.3.34 / 6.1.0 | [0008](decisions/0008-arquitetura-backend.md) |
| Rate limit | @fastify/rate-limit | 11.2.0 | [0017](decisions/0017-protecao-contra-bots.md) |
| Anti-bot (servidor) | altcha-lib | 2.5.0 | [0017](decisions/0017-protecao-contra-bots.md) |
| Anti-bot (navegador) | altcha | 3.2.3 | [0017](decisions/0017-protecao-contra-bots.md) |
| Sessão | @fastify/cookie | 11.1.2 | [0017](decisions/0017-protecao-contra-bots.md) |
| Driver SQLite | better-sqlite3 | 13.0.3 | [0006](decisions/0006-acesso-a-dados.md) |
| Acesso a dados e migrations | Kysely | 0.29.6 | [0006](decisions/0006-acesso-a-dados.md) |
| Infraestrutura | Docker Compose (`compose.yaml` prod, `compose.dev.yaml` dev) | Compose v2 | [0005](decisions/0005-docker-compose.md) |
| Imagem Node | `node:24.21.0-slim` | 24.21.0 | [0005](decisions/0005-docker-compose.md) |
| Servidor web | `nginx:1.30.5-alpine` | 1.30.5 | [0005](decisions/0005-docker-compose.md) |
| Lint | ESLint + typescript-eslint + eslint-plugin-vue | 10.11.0 / 8.70.1 / 10.11.1 | [0011](decisions/0011-lint-e-formatacao.md) |
| Fronteiras entre camadas | eslint-plugin-boundaries | 7.2.0 | [0011](decisions/0011-lint-e-formatacao.md) |
| Resolução de imports no lint | eslint-import-resolver-typescript | 4.4.5 | [0011](decisions/0011-lint-e-formatacao.md) |
| Formatação | Prettier | 3.9.9 | [0011](decisions/0011-lint-e-formatacao.md) |
| Testes unitários e integração | Vitest | 5.0.2 | [0009](decisions/0009-testes.md) |
| Testes de componentes Vue | @vue/test-utils | 2.5.1 | [0009](decisions/0009-testes.md) |
| Testes E2E | Playwright | 1.63.0 | [0009](decisions/0009-testes.md) |
| Imagem E2E | `mcr.microsoft.com/playwright:v1.63.0-noble` | 1.63.0 | [0009](decisions/0009-testes.md) |
| Plugin Vue para Vite | @vitejs/plugin-vue | 6.0.9 | [0003](decisions/0003-frontend-vue.md) |
| Checagem de tipos `.vue` | vue-tsc | 3.3.11 | [0003](decisions/0003-frontend-vue.md) |
| DOM nos testes de componente | jsdom | 30.1.1 | [0009](decisions/0009-testes.md) |
| Recarga do backend em dev | tsx | 4.23.15 | [0005](decisions/0005-docker-compose.md) |
| Tipos do Node | @types/node | 24.13.6 (linha 24, igual ao runtime) | [0002](decisions/0002-runtime-e-backend.md) |
| Tipos do driver SQLite | @types/better-sqlite3 | 9.6.0 | [0006](decisions/0006-acesso-a-dados.md) |

Regra: somente versões estáveis (tag `latest` do npm, Node.js LTS).
