# Quickstart: validar o Ranking por estado

Pré-requisitos e forma de subir a aplicação iguais aos da
[feature 001](../001-municipality-search/quickstart.md).

## Cenários manuais

| # | Ação | Resultado esperado | Requisito |
|---|---|---|---|
| 1 | Clicar em "Busca por estado" no menu | Tela aberta em `/states`; menu indica a tela atual | FR-016 |
| 2 | Abrir a seleção de UF | 27 UFs em ordem alfabética, com nome e sigla | FR-001 |
| 3 | Escolher Minas Gerais | URL `/states/31`; totais e 853 municípios em densidade decrescente | FR-002, FR-005, FR-008, FR-017 |
| 4 | Escolher Distrito Federal | Uma linha, posição 1; totais iguais aos do município | FR-002 |
| 5 | Escolher Rio Grande do Sul | Área total 281.707,15 km² com nota da área fora dos municípios; nenhuma linha sem nome | FR-007, FR-009 |
| 6 | Em MG, digitar `juiz` no filtro | Só "Juiz de Fora", com a posição do ranking completo; contagem "1 de 853 municípios" | FR-019, FR-020 |
| 7 | Digitar `xyz` no filtro | Mensagem de nenhum município correspondente | FR-021 |
| 8 | Trocar para outra UF | Filtro limpo; totais e ranking da nova UF | FR-013, FR-022 |
| 9 | Recarregar `/states/31` | Mesma UF, totais e ranking | FR-017 |
| 10 | Abrir `/states/99` e `/states/abc` | Tela sem UF com aviso de endereço inválido | FR-018 |
| 11 | Percorrer o ranking de MG só com teclado e em tela de 360px | Tudo legível e utilizável | FR-015 |

## Conferência dos números (SC-002, SC-003)

Para as 27 UFs, comparar a tela com a consulta direta em uma cópia do banco:

```sql
-- totais da UF (inclui o registro sem nome)
SELECT SUM(populacao), SUM(area_km2) FROM setor
WHERE cd_setor >= :uf AND cd_setor < :uf_seguinte;

-- ranking
SELECT s.cd_mun, m.nm_mun, SUM(s.populacao) * 1.0 / SUM(s.area_km2) AS densidade
FROM setor s JOIN municipio m USING (cd_mun)
WHERE m.cd_uf = :uf AND s.cd_mun <> '.'
GROUP BY s.cd_mun ORDER BY densidade DESC;
```

## Testes automatizados

| Nível | O que cobre |
|---|---|
| Unitário | Handlers com readers falsos; `text-search` do frontend com a tabela de casos compartilhada; formatação |
| Integração | Readers de UFs e de ranking contra SQLite em memória (UF com um município, registro `.`, ordenação com acentos, empate de densidade); rotas via `fastify.inject()` |
| E2E | Cenários 1, 3, 5, 6, 9 e 10 no navegador, com cópia do banco |

Nenhum teste usa `censo.sqlite` diretamente.
