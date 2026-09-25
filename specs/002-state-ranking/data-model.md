# Data Model: Ranking por estado

Somente leitura. Nomes do banco em português só em `infra/database`.

## Tabelas de origem

| Tabela | Colunas usadas |
|---|---|
| `uf` | `cd_uf`, `nm_uf` |
| `municipio` | `cd_mun`, `nm_mun`, `cd_uf` |
| `setor` | `cd_setor`, `cd_mun`, `area_km2`, `populacao` |

## Value Objects (domain)

Reusa `StateCode` da feature 001 (2 dígitos, entre os 27 códigos, com
`abbreviation`). Erro: `InvalidStateCodeError`. Nenhum VO novo.

## Modelos de leitura (application)

### StateSummary

| Campo | Tipo | Origem |
|---|---|---|
| `code` | string (2 dígitos) | `uf.cd_uf` |
| `abbreviation` | string (2 letras) | `StateCode.abbreviation` |
| `name` | string | `uf.nm_uf` |

### StateRanking

| Campo | Tipo | Regra |
|---|---|---|
| `state` | `StateSummary` | UF escolhida |
| `totals.population` | inteiro | soma de `setor.populacao` de todos os setores da UF |
| `totals.areaKm2` | decimal | soma de `setor.area_km2` de todos os setores da UF, inclusive do registro `.` |
| `totals.populationDensity` | decimal | `population / areaKm2` |
| `totals.areaOutsideMunicipalitiesKm2` | decimal | área dos setores do registro `.` na UF (0 em todas as UFs exceto RS) |
| `items` | lista de `RankingItem` | um por município nomeado da UF |

### RankingItem

| Campo | Tipo | Regra |
|---|---|---|
| `position` | inteiro | 1..N, sequencial após a ordenação |
| `code`, `name` | string | `municipio` |
| `population` | inteiro | soma dos setores do município |
| `areaKm2` | decimal | soma dos setores do município |
| `populationDensity` | decimal | `population / areaKm2` |

Ordenação: `populationDensity` decrescente; empate exato por `name` com
regra pt-BR.

Invariantes:

- soma de `items[].population` = `totals.population`;
- soma de `items[].areaKm2` + `areaOutsideMunicipalitiesKm2` = `totals.areaKm2`;
- `position` sem repetição nem lacuna.

## Portas de leitura (application)

| Porta | Método | Implementação (infra) |
|---|---|---|
| `StatesReader` | `listAll(): Promise<StateSummary[]>` | consulta Kysely em `uf`, ordenação pt-BR |
| `StateRankingReader` | `findByState(code: StateCode): Promise<StateRanking>` | consulta Kysely por intervalo da chave primária (research R1, R2) |

Cada Query tem seu reader (ADR 0012); a lista de UFs e o ranking não se
chamam.

## Estados da tela (frontend)

```
sem UF ──escolhe UF──► carregando ──ok──► exibindo ──digita──► filtrado
  ▲                        │                  ▲                   │
  │                      erro ──tentar──►     └──── apaga termo ──┘
  └──── URL com código inválido
```
