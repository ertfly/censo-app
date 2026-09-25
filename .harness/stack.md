# Stack

> Status: em definição

| Camada | Tecnologia | Versão | ADR |
|---|---|---|---|
| Runtime | Node.js LTS "Krypton" | 24.21.0 | [0002](decisions/0002-runtime-e-backend.md) |
| Linguagem | TypeScript | 7.0.2 | [0002](decisions/0002-runtime-e-backend.md) |
| Backend | Fastify | 5.12.5 | [0002](decisions/0002-runtime-e-backend.md) |
| Frontend | Vue 3 (Composition API) | 3.5.43 | [0003](decisions/0003-frontend-vue.md) |
| Build | Vite | 8.3.1 | [0003](decisions/0003-frontend-vue.md) |
| Roteamento | Vue Router | 5.3.1 | [0003](decisions/0003-frontend-vue.md) |
| Estado | Pinia | 4.0.3 | [0003](decisions/0003-frontend-vue.md) |
| Estilo | Tailwind CSS | 4.3.3 | [0004](decisions/0004-ui-tailwind-shadcn-vue.md) |
| Componentes | shadcn-vue + Reka UI | 2.8.2 / 2.10.5 | [0004](decisions/0004-ui-tailwind-shadcn-vue.md) |
| Banco de dados | SQLite (`data/censo.sqlite`) | 3 | [0001](decisions/0001-banco-de-dados-sqlite.md) |
| Acesso a dados | _a definir_ | | |
| Infraestrutura | Docker Compose (`compose.yaml` prod, `compose.dev.yaml` dev) | Compose v2 | [0005](decisions/0005-docker-compose.md) |
| Imagem Node | `node:24.21.0-slim` | 24.21.0 | [0005](decisions/0005-docker-compose.md) |
| Servidor web | `nginx:1.30.5-alpine` | 1.30.5 | [0005](decisions/0005-docker-compose.md) |
| Testes | _a definir_ | | |

Regra: somente versões estáveis (tag `latest` do npm, Node.js LTS).
