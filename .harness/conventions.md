# Convenções

> Status: em definição

## Idioma

| Contexto | Idioma |
|---|---|
| Código: classes, interfaces, tipos, funções, variáveis, arquivos, pastas | Inglês |
| Todas as rotas (API e URLs das páginas do frontend) e campos do JSON | Inglês |
| Tabelas e colunas do banco | Português, como entregue (ver [database.md](database.md)) |
| Documentação (`.harness/`, specs), ADRs e mensagens de commit | Português |
| Tudo que é visual para o usuário (textos da interface, mensagens, rótulos), exceto URLs | Português (pt-BR) por padrão |

### Textos para o usuário

- O idioma padrão da interface é pt-BR.
- Números, datas e unidades exibidos seguem o formato pt-BR via `Intl`
  (`203.080.756`, `0,54 km²`).
- A API não envia texto para exibição: erros retornam um código em inglês
  (ex.: `MUNICIPALITY_NOT_FOUND`) e o frontend mostra a mensagem em pt-BR.
- O suporte a outros idiomas (i18n) não faz parte da primeira versão.

### Fronteira entre português e inglês

Os nomes em português existem apenas em `infra/database`: tipos das tabelas
para o Kysely, consultas e migrations. Os readers traduzem as colunas para os
nomes em inglês ao montar os DTOs. Nenhum nome de tabela ou coluna em
português aparece em `domain`, `application`, rotas ou frontend.

```ts
// infra/database: única camada que conhece os nomes em português
db.selectFrom('municipio')
  .select(['cd_mun as code', 'nm_mun as name', 'cd_uf as stateCode'])
```

### Glossário

| Banco (português) | Código (inglês) |
|---|---|
| `uf` | `State` |
| `municipio` | `Municipality` |
| `setor` (setor censitário) | `CensusTract` |
| `demografia` | `Demographics` |
| `cd_uf` | `stateCode` |
| `nm_uf` | `stateName` / `name` |
| `cd_mun` | `municipalityCode` |
| `nm_mun` | `municipalityName` / `name` |
| `cd_setor` | `censusTractCode` |
| `situacao` (`Urbana`, `Rural`) | `areaType` (`'urban'`, `'rural'`) |
| `area_km2` | `areaKm2` |
| `populacao` | `population` |
| `moradores` | `residents` |
| `homens` | `men` |
| `mulheres` | `women` |

Termos novos do domínio entram neste glossário antes de serem usados no
código.

## Nomenclatura

| Elemento | Padrão | Exemplo |
|---|---|---|
| Classes, interfaces, tipos | PascalCase | `MunicipalityCode` |
| Funções, métodos, variáveis | camelCase | `findByState` |
| Constantes de módulo | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| Arquivos e pastas | kebab-case, com sufixo do papel | `municipality-code.vo.ts`, `list-municipalities.handler.ts` |
| Componentes Vue | PascalCase | `MunicipalityList.vue` |
| Rotas da API | kebab-case, substantivos no plural, prefixo `/api` | `/api/states/:stateCode/municipalities` |
| URLs das páginas | kebab-case, substantivos no plural, sem prefixo | `/states/:stateCode/municipalities` |
| Campos do JSON | camelCase | `{ "censusTractCode": "..." }` |

Interfaces não usam prefixo `I` (`MunicipalityReader`, não
`IMunicipalityReader`).

## Organização de pastas

Backend: ver [ADR 0008](decisions/0008-arquitetura-backend.md).
Frontend: ver [ADR 0014](decisions/0014-arquitetura-frontend.md).

## Estilo de código

- Indentação com 4 espaços, sem tabs.
- Sem ponto e vírgula, aspas simples, vírgula final, linhas até 100
  caracteres, LF.
- Ferramentas e fronteiras entre camadas: ver
  [ADR 0011](decisions/0011-lint-e-formatacao.md).

## Testes

Ver [ADR 0009](decisions/0009-testes.md).
