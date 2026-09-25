# Quickstart: validar a Busca de município

Roteiro para provar que a feature funciona de ponta a ponta. Comandos exatos
de teste e lint são definidos na montagem do projeto (fundação, research R9);
aqui ficam os cenários e os resultados esperados.

## Pré-requisitos

- Docker e Git com Git LFS.
- `censo.sqlite` na raiz, baixado pelo LFS (não um ponteiro de texto).
- `.env` criado a partir de `.env.example`.

## Subir a aplicação

```bash
docker compose up                              # produção
docker compose -f compose.dev.yaml up          # desenvolvimento
```

Abrir o endereço publicado pelo nginx (porta definida no `.env`).

## Cenários manuais

| # | Ação | Resultado esperado | Requisito |
|---|---|---|---|
| 1 | Abrir `/` | Redireciona para `/municipalities`; menu indica "Busca de cidades" | FR-019, FR-020 |
| 2 | Digitar `s` | Nenhuma sugestão | FR-002 |
| 3 | Digitar `sao pau` | "São Paulo/SP" entre as sugestões | FR-003, FR-004 |
| 4 | Digitar `paulo` | Inclui "São Paulo/SP" e "Paulo Afonso/BA" | FR-004 |
| 5 | Digitar `aulo` | "Nenhum município encontrado…" | FR-004, FR-007 |
| 6 | Digitar `BOM JESUS` | Cinco sugestões "Bom Jesus" com UFs diferentes, antes de "Bom Jesus da…" | FR-005, FR-006 |
| 7 | Escolher "São Paulo/SP" com teclado (setas + Enter) | URL vira `/municipalities/3550308`; ficha com os 6 indicadores | FR-009, FR-016, FR-017 |
| 8 | Recarregar a página | Mesmo município e indicadores | FR-017 |
| 9 | Abrir `/municipalities/9999999` e `/municipalities/abc` | Busca vazia com aviso de endereço inválido | FR-018 |
| 10 | Escolher um município com setores sem classificação e com população sem informação de sexo | Categorias "Sem classificação" e "Sem informação" aparecem; percentuais somam 100,0% | FR-010, FR-011 |
| 11 | Digitar `arco` | Inclui "Pau D'Arco/PA" e "Pau D'Arco/TO" | FR-004 |
| 12 | Conferir título da aba e rodapé com um município escolhido | "São Paulo/SP - Censo 2022"; "Fonte: IBGE, Censo Demográfico 2022" | FR-024, FR-026 |
| 13 | Repetir 3 e 7 em tela de 360px | Tudo legível e utilizável | FR-016 |

## Conferência dos números (SC-004)

Para uma amostra de municípios (capitais, homônimos, com setores sem
classificação, com população sem informação de sexo), comparar a ficha com a
consulta direta em uma cópia do banco:

```sql
SELECT COUNT(*), SUM(s.populacao), SUM(s.area_km2),
       SUM(COALESCE(d.homens, 0)), SUM(COALESCE(d.mulheres, 0))
FROM setor s LEFT JOIN demografia d USING (cd_setor)
WHERE s.cd_mun = :codigo;
```

## Testes automatizados

| Nível | O que cobre | Referência |
|---|---|---|
| Unitário | `StateCode`, `MunicipalityCode`, `SearchTerm`; handlers com readers falsos; percentuais pelo maior resto; formatação pt-BR | ADR 0009 |
| Integração | Índice de busca e reader de indicadores contra SQLite em memória com dados de teste (registro `.`, homônimos, sem classificação, sexo ausente); rotas via `fastify.inject()` | ADR 0009 |
| E2E | Cenários 1, 3, 5, 7, 8, 9 no navegador, contra a stack em Docker com cópia do banco | ADR 0009 |

Nenhum teste usa `censo.sqlite` diretamente (Princípio V).
