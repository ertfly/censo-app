# 0011. Lint, formatação e fronteiras de importação

- Status: Aceito (fronteiras revistas pelo [ADR 0013](0013-organizacao-do-repositorio.md))
- Data: 2026-09-25

## Contexto

O código precisa de formatação uniforme e de uma verificação automática da
regra de dependência entre camadas definida no
[ADR 0008](0008-arquitetura-backend.md). Requisito de formatação: indentação
com 4 espaços, sem tabs. O restante segue recomendação.

## Decisão

### Ferramentas

| Uso | Ferramenta | Versão |
|---|---|---|
| Lint | ESLint (flat config) | 10.11.0 |
| Regras TypeScript | typescript-eslint | 8.70.1 |
| Regras Vue | eslint-plugin-vue + @vue/eslint-config-typescript | 10.11.1 / 14.9.0 |
| Fronteiras entre camadas | eslint-plugin-boundaries | 7.2.0 |
| Formatação | Prettier | 3.9.9 |
| Integração ESLint + Prettier | eslint-config-prettier | 10.1.8 |

O ESLint cuida de qualidade e fronteiras; o Prettier cuida só de formatação.
`eslint-config-prettier` desliga as regras de estilo do ESLint que
conflitariam com o Prettier.

### Formatação

`.prettierrc`:

| Opção | Valor | Motivo |
|---|---|---|
| `tabWidth` | `4` | Requisito do projeto |
| `useTabs` | `false` | Requisito do projeto |
| `printWidth` | `100` | Compensa a indentação maior |
| `semi` | `false` | Padrão do ecossistema Vue e Fastify |
| `singleQuote` | `true` | Padrão do ecossistema Vue e Fastify |
| `trailingComma` | `"all"` | Diffs menores |
| `endOfLine` | `"lf"` | Mesmo formato em qualquer sistema |

`.editorconfig` na raiz com os mesmos valores (4 espaços, LF, UTF-8, newline
final, sem espaços no fim da linha), para editores sem Prettier.

Markdown (`.harness/`, `specs/`) fica fora do Prettier, para não reformatar
documentação gerada pelo spec-kit nem as tabelas escritas à mão.

### Fronteiras de importação (backend)

Aplicadas pelo `eslint-plugin-boundaries`, com erro (não aviso):

| Camada | Pode importar | Pacotes externos permitidos |
|---|---|---|
| `domain` | `domain` | Nenhum |
| `application` | `domain`, `application` | `typebox`, `@censo/contracts` (ADR 0013) |
| `infra` | `domain`, `application`, `infra` | Qualquer |
| `main.ts` | Todas | Qualquer |

Fastify, Kysely e better-sqlite3 só aparecem em `infra` e `main.ts`.

### Execução

- Lint e verificação de formatação rodam em container, como os testes
  ([ADR 0009](0009-testes.md)). Comandos definidos na montagem do projeto.
- Violação de fronteira quebra o lint.

## Alternativas consideradas

- **Biome:** lint e formatação em uma ferramenta só e mais rápido, mas o
  suporte a arquivos `.vue` ainda é parcial.
- **Oxlint:** rápido, mas sem a cobertura de regras com tipos e de Vue que o
  projeto precisa.
- **`no-restricted-imports` do ESLint para as fronteiras:** funciona por padrão
  de caminho, mas precisa ser repetido por pasta e não cobre pacotes externos
  de forma declarativa.
- **dependency-cruiser:** robusto, mas é mais uma ferramenta e configuração
  fora do ESLint.

## Consequências

- Componentes copiados do shadcn-vue vêm com 2 espaços e são reformatados pelo
  Prettier ao entrar no projeto.
- Quebra de fronteira é detectada no lint, não em revisão de código.
- As fronteiras do frontend serão definidas junto com a arquitetura do
  frontend.
