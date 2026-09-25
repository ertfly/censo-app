# Data Model: Busca de município

Modelo usado pela feature. Somente leitura (ADR 0007). Nomes em inglês no
código; nomes do banco em português só em `infra/database`
([conventions.md](../../.harness/conventions.md)).

## Tabelas de origem (banco)

Estrutura completa em [database.md](../../.harness/database.md).

| Tabela | Colunas usadas |
|---|---|
| `uf` | `cd_uf`, `nm_uf` |
| `municipio` | `cd_mun`, `nm_mun`, `cd_uf` |
| `setor` | `cd_setor`, `cd_mun`, `situacao`, `area_km2`, `populacao` |
| `demografia` | `cd_setor`, `homens`, `mulheres` |

## Value Objects (domain)

| Value Object | Regra | Erro |
|---|---|---|
| `StateCode` | 2 dígitos, entre os 27 códigos de UF; expõe `abbreviation` (ex.: `35` → `SP`) | `InvalidStateCodeError` |
| `MunicipalityCode` | exatamente 7 dígitos; os 2 primeiros formam um `StateCode` válido | `InvalidMunicipalityCodeError` |
| `SearchTerm` | texto após remover espaços das pontas e colapsar espaços internos; 2 a 60 caracteres; expõe `normalized` (NFD sem diacríticos, minúsculas) | `InvalidSearchTermError` |
| `AreaType` | `'urban'`, `'rural'` ou `'unclassified'` | — |

Erro de domínio adicional: `MunicipalityNotFoundError`.

## Modelos de leitura (application)

### MunicipalitySuggestion

| Campo | Tipo | Origem |
|---|---|---|
| `code` | string (7 dígitos) | `municipio.cd_mun` |
| `name` | string | `municipio.nm_mun` |
| `stateCode` | string (2 dígitos) | `municipio.cd_uf` |
| `stateAbbreviation` | string (2 letras) | `StateCode.abbreviation` |

### MunicipalityIndicators

| Campo | Tipo | Regra |
|---|---|---|
| `code`, `name` | string | `municipio` |
| `state` | `{ code, abbreviation, name }` | `uf` + `StateCode` |
| `population` | inteiro | `SUM(setor.populacao)` |
| `censusTractCount` | inteiro | `COUNT(setor)` |
| `areaKm2` | decimal | `SUM(setor.area_km2)` |
| `populationDensity` | decimal | `population / areaKm2` |
| `areaTypeBreakdown` | lista de `{ areaType, censusTractCount, population }` | por `situacao`: `Urbana` → `urban`, `Rural` → `rural`, nulo → `unclassified`; sempre com `urban` e `rural`; `unclassified` só quando houver setores |
| `sexBreakdown` | `{ men, women, unknown }` | somas de `homens` e `mulheres` (nulo = 0); `unknown = population − men − women` |

Invariantes (verificados na pesquisa, R3):

- `men + women + unknown = population` e `unknown ≥ 0`;
- soma de `censusTractCount` em `areaTypeBreakdown` = `censusTractCount`;
- soma de `population` em `areaTypeBreakdown` = `population`;
- `areaKm2 > 0`.

## Portas de leitura (application)

| Porta | Método | Implementação (infra) |
|---|---|---|
| `MunicipalitySearchReader` | `search(term: SearchTerm, limit: number): Promise<MunicipalitySuggestion[]>` | índice em memória carregado na inicialização (research R1) |
| `MunicipalityIndicatorsReader` | `findByCode(code: MunicipalityCode): Promise<MunicipalityIndicators \| null>` | consulta Kysely por intervalo da chave primária (research R2) |

## Estados da tela (frontend)

```
vazia ──digita ≥2──► sugerindo ──escolhe──► carregando ──ok──► exibindo
  ▲                     │                       │              │
  │                  sem resultado            erro ──tentar──► carregando
  └──── URL com código inválido/inexistente ◄──┘
```
