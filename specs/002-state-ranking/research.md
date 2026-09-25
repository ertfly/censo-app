# Research: Ranking por estado

Fase 0 do plano. Medições em 2026-09-25 sobre uma cópia de `censo.sqlite`.
Reusa a fundação e as decisões da feature 001
([research da 001](../001-municipality-search/research.md)).

## R1. Consulta do ranking

**Decisão**: agregar `setor` por `cd_mun` filtrando pelo intervalo da chave
primária com o prefixo da UF (`cd_setor >= '31' AND cd_setor < '32'`), juntar
com `municipio` para o nome e excluir o registro `.`. A ordenação é feita no
reader em TypeScript: densidade decrescente e, em empate exato, nome com
`Intl.Collator('pt-BR')`. Posições sequenciais atribuídas após a ordenação.

Medições:

| Consulta | Tempo | Plano |
|---|---|---|
| Ranking de MG com join por `municipio.cd_uf` | ~90 ms | varredura |
| Ranking de MG pelo intervalo da chave primária | ~15 ms | busca pela chave primária + agrupamento |
| Ranking de SP (maior UF em setores, 103.319) | ~32 ms | idem |

- Nenhum setor tem prefixo de UF diferente do `cd_uf` do seu município.
- Não há empate exato de densidade na mesma UF; o desempate por nome é
  garantia, não caso frequente.

**Motivo**: `ORDER BY nm_mun` no SQLite usa comparação binária e ordena
acentos de forma errada; a ordenação em TypeScript usa a regra pt-BR. Com no
máximo 853 linhas, ordenar em memória é trivial.

**Índices iniciais desta feature**: nenhum.

**Alternativas**: índice `idx_setor_cd_mun` ou índice por UF: desnecessários
com o intervalo da chave primária; custo de ~13 MB no arquivo versionado.

## R2. Totais da UF

**Decisão**: somar população e área de todos os setores do intervalo da UF,
inclusive os do registro `.` (clarificação Q2). Densidade = população ÷ área.
A resposta também informa a área fora de municípios nomeados
(`areaOutsideMunicipalitiesKm2`), para a interface explicar a diferença entre
a área da UF e a soma do ranking.

Medição: totais do RS em ~1,7 ms; resultado 10.882.965 pessoas e
281.707,15 km² (igual à área oficial).

## R3. Lista de UFs

**Decisão**: `GET /api/states` devolve as 27 UFs com código, sigla (do
`StateCode`, research R7 da 001) e nome, ordenadas pelo nome com regra pt-BR.
Cache no frontend com `staleTime: Infinity`.

## R4. Filtro do ranking

**Decisão**: filtro no frontend, sobre as linhas já carregadas (clarificação
Q1 da 002: todas as linhas de uma vez). Regra idêntica à busca da 001: termo
normalizado (sem acento, minúsculas) no início de qualquer palavra do nome,
separadores espaço, hífen e apóstrofo. Implementação em
`frontend/src/shared/lib/text-search.ts`.

**Motivo**: não gera requisições (não consome o limite da feature 003) e
responde a cada tecla.

**Consequência assumida**: a regra de normalização passa a existir em dois
lugares (`SearchTerm` no backend e `text-search` no frontend). Mitigação: os
dois conjuntos de testes usam a mesma tabela de casos (`sao pau`, `paulo`,
`aulo`, `BOM JESUS`, `pau-d`), mantida em
`test/shared/text-search.cases.json`, na raiz do repositório, como dado. Não
fica em `@censo/contracts`, que só contém schemas (ADR 0013).

**Alternativas**:

- **Filtro pela API**: uma requisição por tecla, consumindo o limite, para
  filtrar dados que já estão na tela.
- **Função compartilhada em `@censo/contracts`**: fere a regra do pacote
  (somente schemas, ADR 0013).

## R5. Endereço da página

| URL | Conteúdo |
|---|---|
| `/states` | Tela sem UF escolhida |
| `/states/:stateCode` | UF escolhida (código IBGE de 2 dígitos) |

- Código inválido: a API responde `INVALID_STATE_CODE`; a tela mostra o
  estado sem UF escolhida com aviso (FR-018).
- O filtro não entra na URL (é transitório e é limpo ao trocar de UF,
  FR-022).
- Mesma regra de `push`/`replace` da 001.

## R6. Tabela com 853 linhas

**Decisão**: tabela HTML simples, sem virtualização, com cabeçalho fixo ao
rolar. Mini-escala de densidade por linha feita com posicionamento CSS
(sem SVG por linha).

**Motivo**: 853 linhas com 6 colunas são leves para o navegador; tabela
semântica mantém leitores de tela e busca do navegador funcionando.

**Alternativas**: virtualização (quebra a busca do navegador e complica
acessibilidade sem ganho necessário); paginação (descartada na clarificação).

## R7. Reuso da feature 001

| Item | Origem |
|---|---|
| `StateCode` (sigla) | domínio, 001 |
| `DensityScale`, `ProportionBar` | `frontend/src/shared/ui`, 001 |
| Formatação pt-BR | `frontend/src/shared/lib/format`, 001 |
| Menu fixo | `frontend/src/widgets/app-header`, 001 |
| Cliente HTTP e mensagens de erro | `frontend/src/shared/api`, 001 |
| Fundação (monorepo, Docker, lint, testes) | 001, research R9 |
