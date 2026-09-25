# 0003. Frontend em Vue 3 com Composition API e Vite

- Status: Aceito (papel do Pinia revisto pelo [ADR 0014](0014-arquitetura-frontend.md))
- Data: 2026-09-25

## Contexto

O censo-app é acessado pelo navegador. O backend é uma API em Fastify
([ADR 0002](0002-runtime-e-backend.md)), e o frontend a consome. O projeto
usa somente versões estáveis e TypeScript em todo o código.

## Decisão

| Item | Escolha | Versão |
|---|---|---|
| Framework | Vue 3, Composition API (`<script setup lang="ts">`) | 3.5.43 |
| Build e dev server | Vite | 8.3.1 |
| Roteamento | Vue Router | 5.3.1 |
| Estado global | Pinia | 4.0.3 |

- Aplicação de página única (SPA) servida separadamente da API.
- Options API não é usada.

## Alternativas consideradas

- **Nuxt:** traz renderização no servidor e backend próprio (Nitro), o que
  duplicaria o papel do Fastify.
- **React ou Svelte:** preferência do projeto por Vue 3 com Composition API.

## Consequências

- Checagem de tipos dos componentes via `vue-tsc`, cuja compatibilidade com o
  TypeScript 7 será validada na montagem do projeto (ver ADR 0002).
- A interface visual segue o [ADR 0004](0004-ui-tailwind-shadcn-vue.md).
