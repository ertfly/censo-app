# Contratos da API: Busca de município

Schemas implementados em `@censo/contracts` (ADR 0013). Rotas e campos em
inglês. Todas as rotas exigem sessão verificada quando a feature 003 estiver
implementada (ADR 0017); o erro de sessão e o de limite são definidos no
contrato da 003.

Arquivos no pacote de contratos:

```
packages/contracts/src/
├── common/error-response.contract.ts
└── municipalities/
    ├── search-municipalities.contract.ts
    └── get-municipality-indicators.contract.ts
```

## Erro padrão

Toda resposta de erro tem o formato:

```json
{ "code": "MUNICIPALITY_NOT_FOUND" }
```

A mensagem exibida ao visitante é definida pelo frontend (`shared/api`).

## GET /api/municipalities/suggestions

Sugestões para o autocomplete (FR-002 a FR-008).

**Query string**

| Campo | Tipo | Regra |
|---|---|---|
| `q` | string | obrigatório; 2 a 60 caracteres após remover espaços das pontas |

**200**

```json
{
    "items": [
        { "code": "3550308", "name": "São Paulo", "stateCode": "35", "stateAbbreviation": "SP" }
    ]
}
```

- No máximo 10 itens, na ordem definida em [research.md](../research.md#r1-busca-sem-acento-por-início-de-palavra).
- Nenhum resultado: `200` com `items: []` (não é erro).

**Erros**

| Status | Código | Quando |
|---|---|---|
| 400 | `INVALID_SEARCH_TERM` | `q` ausente, curto ou longo demais |

## GET /api/municipalities/:municipalityCode

Indicadores do município (FR-009 a FR-012, FR-017, FR-018).

**Parâmetros**

| Campo | Tipo | Regra |
|---|---|---|
| `municipalityCode` | string | 7 dígitos |

**200**

```json
{
    "code": "3550308",
    "name": "São Paulo",
    "state": { "code": "35", "abbreviation": "SP", "name": "São Paulo" },
    "population": 11451999,
    "censusTractCount": 27301,
    "areaKm2": 1521.2,
    "populationDensity": 7528.26,
    "areaTypeBreakdown": [
        { "areaType": "urban", "censusTractCount": 27000, "population": 11300000 },
        { "areaType": "rural", "censusTractCount": 250, "population": 151999 },
        { "areaType": "unclassified", "censusTractCount": 51, "population": 0 }
    ],
    "sexBreakdown": { "men": 5400000, "women": 6000000, "unknown": 51999 }
}
```

Valores ilustrativos; os reais vêm da base.

- `areaKm2` e `populationDensity` sem arredondamento; a formatação é do
  frontend.
- `areaTypeBreakdown` sempre contém `urban` e `rural` (com zero se não
  houver) e contém `unclassified` apenas quando houver setores sem
  classificação.
- Percentuais não fazem parte da resposta (calculados no frontend,
  research R4).

**Erros**

| Status | Código | Quando |
|---|---|---|
| 400 | `INVALID_MUNICIPALITY_CODE` | código fora do formato de 7 dígitos ou com UF inexistente |
| 404 | `MUNICIPALITY_NOT_FOUND` | código válido sem município correspondente, ou o registro sem nome |

## GET /api/health

Verificação de saúde usada pelo Docker Compose (ADR 0005). Não exige sessão.

**200**: `{ "status": "ok" }`

## Mensagens do frontend por código

| Código | Mensagem |
|---|---|
| `INVALID_SEARCH_TERM` | Digite pelo menos 2 letras. |
| `INVALID_MUNICIPALITY_CODE` | Este endereço não corresponde a nenhum município. Busque pelo nome. |
| `MUNICIPALITY_NOT_FOUND` | Este endereço não corresponde a nenhum município. Busque pelo nome. |
| Falha de rede ou 5xx | Não foi possível carregar os dados. Tentar de novo. |
