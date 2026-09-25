# Contratos da API: Ranking por estado

Schemas em `@censo/contracts` (ADR 0013). Erro padrão `{ "code": "..." }`,
definido na feature 001. Rotas exigem sessão verificada quando a feature 003
estiver implementada.

```
packages/contracts/src/states/
├── list-states.contract.ts
└── get-state-density-ranking.contract.ts
```

## GET /api/states

Lista das 27 UFs (FR-001).

**200**

```json
{
    "items": [
        { "code": "12", "abbreviation": "AC", "name": "Acre" },
        { "code": "27", "abbreviation": "AL", "name": "Alagoas" }
    ]
}
```

Sempre 27 itens, ordenados pelo nome com regra pt-BR.

## GET /api/states/:stateCode/density-ranking

Totais da UF e ranking dos municípios por densidade (FR-002 a FR-009,
FR-017, FR-018).

**Parâmetros**

| Campo | Tipo | Regra |
|---|---|---|
| `stateCode` | string | 2 dígitos, um dos 27 códigos de UF |

**200**

```json
{
    "state": { "code": "43", "abbreviation": "RS", "name": "Rio Grande do Sul" },
    "totals": {
        "population": 10882965,
        "areaKm2": 281707.1504883,
        "populationDensity": 38.63,
        "areaOutsideMunicipalitiesKm2": 13085.864101
    },
    "items": [
        {
            "position": 1,
            "code": "4314902",
            "name": "Porto Alegre",
            "population": 1332845,
            "areaKm2": 495.39,
            "populationDensity": 2690.5
        }
    ]
}
```

Valores de `items` ilustrativos; os totais do RS são reais.

- `items` contém todos os municípios nomeados da UF, na ordem do ranking.
- Decimais sem arredondamento; a formatação é do frontend.

**Erros**

| Status | Código | Quando |
|---|---|---|
| 400 | `INVALID_STATE_CODE` | código fora do formato ou fora dos 27 códigos |

## Mensagens do frontend por código

| Código | Mensagem |
|---|---|
| `INVALID_STATE_CODE` | Este endereço não corresponde a nenhuma unidade federativa. Escolha uma na lista. |
| Falha de rede ou 5xx | Não foi possível carregar os dados. Tentar de novo. |
