# 0014. Arquitetura do frontend: Feature-Sliced Design enxuto

- Status: Aceito
- Data: 2026-09-25
- Revisa: [ADR 0003](0003-frontend-vue.md) (papel do Pinia) e
  [ADR 0011](0011-lint-e-formatacao.md) (fronteiras do frontend)

## Contexto

O frontend em Vue 3 ([ADR 0003](0003-frontend-vue.md)) consome a API tipada
por `@censo/contracts` ([ADR 0013](0013-organizacao-do-repositorio.md)). A
primeira versão é somente leitura, com poucas telas, e deve crescer sem
reorganização.

Foi avaliado o Feature-Sliced Design (FSD). Completo (seis camadas), ele gera
estrutura e discussões de classificação desproporcionais ao tamanho da v1. A
própria documentação do FSD considera as camadas opcionais.

## Decisão

### Estrutura

```
frontend/src/
├── app/            # main.ts, router, plugins (vue-query, Pinia), estilos, tema
├── pages/          # uma slice por rota
├── entities/       # uma slice por conceito do domínio (state, municipality, census-tract)
└── shared/
    ├── ui/         # componentes shadcn-vue
    ├── api/        # cliente HTTP, mapa código de erro → mensagem pt-BR
    └── lib/        # utilitários sem domínio (formatadores Intl pt-BR)
```

- Camadas `features` e `widgets` não existem na v1; são criadas pelos
  critérios abaixo.
- Cada slice tem segmentos conforme a necessidade: `ui`, `model`, `api`,
  `lib`.
- Cada slice expõe uma API pública em `index.ts`; importações de fora da slice
  passam só por ela.
- Alias de importação `@/` apontando para `frontend/src` (padrão esperado pelo
  shadcn-vue).

### Critérios de camada

| Camada | Entra quando |
|---|---|
| `shared` | Não tem nenhum conhecimento do censo |
| `entities` | Representa um conceito do domínio e é usado em mais de uma página |
| `features` | Ação do usuário reusada em mais de uma página |
| `widgets` | Bloco composto reusado em mais de uma página |
| `pages` | Todo o resto |

Regra geral: todo código começa na página e só sobe de camada quando for
reusado.

### Regras de importação

- Uma camada só importa das camadas abaixo:
  `app → pages → widgets → features → entities → shared`.
- Slices da mesma camada não importam umas das outras.
- Importação só pela API pública da slice (`@/entities/municipality`, nunca
  `@/entities/municipality/ui/...`).
- `@censo/contracts` pode ser importado em qualquer camada (tipos por padrão,
  ver ADR 0013).
- Verificação pelo `eslint-plugin-boundaries` (já na stack), com erro. O
  linter oficial do FSD (Steiger) não é usado enquanto estiver em versão 0.x.

### Estado

| Tipo de estado | Ferramenta | Onde fica |
|---|---|---|
| Dados do servidor (consultas à API) | `@tanstack/vue-query` 5.103.2 | `entities/<slice>/api` |
| Estado do cliente (filtros, preferências) | Pinia 4.0.3, só se necessário | `model` da slice que usa |

- Consultas usam `staleTime: Infinity` na v1: os dados são somente leitura e
  não mudam durante a sessão.
- Pinia não guarda dados vindos da API.

### Consumo da API

- `shared/api` contém o cliente HTTP (`fetch` com prefixo `/api`) e a classe
  de erro com o código retornado pela API.
- A tradução de código de erro para mensagem pt-BR fica em `shared/api`.
- As consultas tipadas com os contratos ficam em `entities/<slice>/api`.

### Vocabulário

No frontend, "entity" e "feature" têm o sentido do FSD. Ver o glossário em
[conventions.md](../conventions.md).

## Alternativas consideradas

- **Por tipo (`components/`, `composables/`, `stores/`, `views/`):** degrada
  conforme cresce; `components/` vira depósito sem dono.
- **Módulos por funcionalidade:** o que é reusado entre módulos acaba em
  `shared/`, que vira depósito; é o caso de componentes de município e UF.
- **FSD completo:** estrutura e discussões de classificação desproporcionais à
  v1.
- **Dados do servidor em stores Pinia:** exige reescrever cache, carregamento,
  erro e nova tentativa em cada store.

## Consequências

- Crescimento sem reorganização: `features` e `widgets` entram quando houver
  reuso.
- Uma dependência nova (`@tanstack/vue-query`).
- É possível que a v1 não use Pinia; ele permanece na stack para estado do
  cliente.
- Componentes visuais seguem a skill `frontend-design`
  ([ADR 0004](0004-ui-tailwind-shadcn-vue.md)).
