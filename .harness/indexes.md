# Índices: diagnóstico e guia

> Ponto de partida para criar índices quando o desenvolvimento pedir.
> Estrutura do banco: [database.md](database.md).

## Situação atual

- Nenhum índice secundário. Só as chaves primárias, que são clusterizadas
  porque as tabelas são `WITHOUT ROWID`.
- Nenhum índice nas colunas de FK (`municipio.cd_uf`, `setor.cd_mun`).
- Sem estatísticas do otimizador (`ANALYZE` nunca rodou).

## Medições de referência

Medido em 2026-09-25, em uma cópia do banco. O arquivo versionado não foi
alterado. Tempos em milissegundos, média de 2 execuções.

| Consulta | Sem índice | Com índice | Plano sem índice |
|---|---|---|---|
| Setores de um município (`WHERE cd_mun = ?`) | 21 | 7 | `SCAN setor` |
| Setores de um município pelo intervalo da PK | 1,4 | 1,3 | `SEARCH` pela PK |
| Municípios de uma UF (`WHERE cd_uf = ?`) | 0,2 | 0,04 | `SCAN municipio` |
| População por município (`GROUP BY cd_mun`) | 103 | 115 | `SCAN` + B-tree temporária |
| População por UF (join + `GROUP BY`) | 150 | 121 | `SCAN s` + `SEARCH m` pela PK |

Custo medido: os dois índices levaram o arquivo de ~35 MB para ~48 MB. Com
Git LFS, cada commit do banco guarda uma cópia inteira do arquivo.

## Conclusão

Com esse volume, nenhuma consulta testada é lenta a ponto de exigir índice
agora. A recomendação é **não criar índices antecipadamente**: criar quando
uma consulta real da aplicação justificar, seguindo o processo abaixo.

## Alternativa sem índice: intervalo da chave primária

O código do setor começa com o código do município (ver
[database.md](database.md#hierarquia-dos-códigos)). Por isso, filtrar por
intervalo da PK usa o índice clusterizado e é mais rápido que um índice em
`cd_mun`, sem custo de espaço:

```sql
-- Em vez de:
SELECT * FROM setor WHERE cd_mun = '3550308';

-- Usar:
SELECT * FROM setor
WHERE cd_setor >= '3550308' AND cd_setor < '3550309';
```

O mesmo vale para todos os setores de uma UF (`>= '35'` e `< '36'`).

Exceção: os 2 setores do município `.` não seguem o prefixo (achado 1 em
[database.md](database.md#qualidade-dos-dados)).

## Candidatos

Em ordem de probabilidade de necessidade.

| # | Índice | Quando criar | Custo estimado |
|---|---|---|---|
| 1 | `CREATE INDEX idx_setor_cd_mun ON setor(cd_mun);` | Consultas por `cd_mun` em que o intervalo da PK não sirva (ex.: ORM gerando `WHERE cd_mun = ?`, joins a partir de `municipio`) | ~13 MB |
| 2 | `CREATE INDEX idx_municipio_cd_uf ON municipio(cd_uf);` | Listagem de municípios por UF em tela ou API | Desprezível |
| 3 | `CREATE INDEX idx_municipio_nm_mun ON municipio(nm_mun COLLATE NOCASE);` | Busca de município por nome (autocomplete com `LIKE 'texto%'`) | Pequeno |
| 4 | `CREATE INDEX idx_setor_mun_situacao ON setor(cd_mun, situacao);` | Filtros combinados de município e situação urbana/rural | ~14 MB; substitui o #1 |
| 5 | Índices em tabelas novas | Toda FK criada pela aplicação | Depende da tabela |

Observações:

- `situacao` sozinha tem baixa seletividade (2 valores). Um índice só nela
  raramente ajuda.
- Busca com `LIKE '%texto%'` (curinga no início) não usa índice. Se isso for
  necessário, avaliar FTS5 em vez de índice comum.
- Agregações que varrem a tabela toda (`GROUP BY` sobre todos os setores)
  pouco se beneficiam de índice. Se ficarem lentas, avaliar uma tabela de
  resumo por município/UF.

## Processo para criar um índice

1. **Identificar a consulta** real, com os parâmetros usados pela aplicação.
2. **Ver o plano:**
   ```sql
   EXPLAIN QUERY PLAN <consulta>;
   ```
   `SCAN <tabela>` em tabela grande indica leitura completa. `SEARCH ... USING`
   indica uso de chave ou índice.
3. **Medir antes**, em uma cópia do banco:
   ```bash
   cp data/censo.sqlite /tmp/teste.sqlite
   sqlite3 /tmp/teste.sqlite ".timer on" "<consulta>"
   ```
4. **Testar alternativas sem índice** (intervalo da PK, reescrita da consulta).
5. **Criar o índice na cópia**, rodar `ANALYZE`, repetir os passos 2 e 3.
6. **Medir o custo**: tamanho do arquivo antes e depois, e impacto nas
   escritas.
7. **Registrar**: se compensar, criar um ADR com as medições e aplicar via
   migration. Atualizar a tabela de candidatos acima.
