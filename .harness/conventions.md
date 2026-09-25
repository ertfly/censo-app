# Convenções

> Status: em definição

## Idioma

| Contexto | Idioma |
|---|---|
| Código: classes, interfaces, tipos, funções, variáveis, arquivos, pastas | Inglês |
| Rotas da API e campos do JSON | Inglês |
| Tabelas e colunas do banco | Português, como entregue (ver [database.md](database.md)) |
| Documentação (`.harness/`, specs), ADRs e mensagens de commit | Português |

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
| Campos do JSON | camelCase | `{ "censusTractCode": "..." }` |

Interfaces não usam prefixo `I` (`MunicipalityReader`, não
`IMunicipalityReader`).

## Organização de pastas

Backend: ver [ADR 0008](decisions/0008-arquitetura-backend.md).
Frontend: _a definir._

## Estilo de código

_A definir (lint, formatação)._

## Testes

Ver [ADR 0009](decisions/0009-testes.md).
