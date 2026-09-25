# Research: Busca de município

Fase 0 do plano. Cada item registra decisão, motivo e alternativas. Medições
feitas em 2026-09-25 sobre uma cópia de `censo.sqlite` (o arquivo versionado
não foi alterado).

## R1. Busca sem acento por início de palavra

**Decisão**: índice de busca em memória no backend. Na inicialização, o reader
carrega os 5.570 municípios com nome (exclui o registro `.`) e guarda, para
cada um, o nome normalizado (NFD, sem diacríticos, minúsculas) e as posições de
início de palavra (após espaço, hífen ou apóstrofo). A busca normaliza o termo
e seleciona os nomes em que o termo começa em alguma dessas posições.

Ordenação dos resultados (FR-006):

1. Nomes que começam com o termo (posição 0).
2. Demais nomes (termo no início de outra palavra).
3. Dentro de cada grupo, nome em ordem alfabética pt-BR (`Intl.Collator('pt-BR')`)
   e, em empate, sigla da UF.
4. Limite de 10 resultados.

**Motivo**:

- O `LIKE` do SQLite não ignora acentos; a regra de início de palavra exige
  tratamento de separadores.
- Os dados são somente leitura (ADR 0007) e pequenos: carregar todos os nomes
  leva ~2 ms e ocupa poucos KB.
- Não altera o schema nem o arquivo versionado.

**Alternativas consideradas**:

- **FTS5 com `unicode61 remove_diacritics`** (disponível no SQLite do
  better-sqlite3): resolve acento e prefixo de palavra, mas exige migration
  com tabela nova no banco versionado (cópia inteira no LFS) e ainda precisa
  de lógica própria para priorizar o início do nome.
- **Coluna normalizada + índice via migration**: mesmo custo de migration e
  não resolve início de palavra sem consulta mais complexa.
- **Busca no frontend com a lista completa**: expõe a lista inteira a cada
  visita e move regra de domínio para o frontend.

A implementação do índice em memória fica em `infra/database` e implementa a
porta de leitura da Query (ADR 0008); a regra de normalização do termo é um
Value Object (`SearchTerm`).

## R2. Agregação dos indicadores do município

**Decisão**: uma consulta sobre `setor` com `LEFT JOIN demografia`, filtrando
pelo intervalo da chave primária (`cd_setor >= :code AND cd_setor < :code+1`)
e, por segurança, também por `cd_mun = :code`. Agrupamento por `situacao` para
a divisão urbano/rural; somas de `homens` e `mulheres` para a distribuição por
sexo.

Medições (São Paulo, maior município, ~27 mil setores):

| Consulta | Tempo | Plano |
|---|---|---|
| Filtro por `cd_mun` | ~29 ms | varredura de `setor` |
| Intervalo da chave primária | ~10 ms | busca pela chave primária |

**Motivo**: o código do setor começa com o código do município; a única
exceção são os 2 setores do registro `.`, que nunca é consultado nesta tela
(FR-008). Sem índice novo.

**Índices iniciais desta feature**: nenhum (ver [indexes.md](../../.harness/indexes.md)).

**Alternativas consideradas**: índice `idx_setor_cd_mun` (candidato 1 do
`indexes.md`): ~7 ms, mas +13 MB no arquivo versionado; o intervalo da chave
primária é equivalente sem custo.

## R3. Regras de cálculo dos indicadores

**Decisão**:

| Indicador | Regra |
|---|---|
| População total | `SUM(setor.populacao)` |
| Setores censitários | `COUNT(*)` de setores do município |
| Área total | `SUM(setor.area_km2)` |
| Densidade | população total ÷ área total |
| Urbano / Rural / Sem classificação | por `situacao` (`Urbana`, `Rural`, nulo): contagem de setores e soma da população |
| Homens / Mulheres | `SUM(demografia.homens)`, `SUM(demografia.mulheres)`, nulos contados como 0 |
| Sem informação de sexo | população total − homens − mulheres |

Invariantes verificados em todos os municípios:

- homens + mulheres nunca ultrapassa a população (sem informação ≥ 0);
- todo setor com população > 0 tem linha em `demografia`;
- nenhum município tem área total 0.

**Motivo**: `setor.populacao` é igual a `demografia.moradores` sempre que os
dois existem (database.md, achado 6); usar `setor` cobre também setores sem
demografia.

## R4. Percentuais que somam 100%

**Decisão**: percentuais calculados no frontend a partir das contagens da API,
com 1 casa decimal, pelo método do maior resto (arredonda para baixo e
distribui os décimos restantes para as maiores frações), garantindo soma
exata de 100,0%.

**Motivo**: a clarificação Q2 exige que os percentuais somem 100%;
arredondamento simples pode dar 99,9% ou 100,1%.

**Alternativas**: percentuais calculados na API (mistura apresentação no
contrato); arredondamento simples (soma incorreta).

## R5. Endereço da página e navegação

**Decisão**:

| URL | Conteúdo |
|---|---|
| `/` | Redireciona para `/municipalities` (FR-019) |
| `/municipalities` | Tela "Busca de cidades" vazia |
| `/municipalities/:municipalityCode` | Tela com o município escolhido (FR-017) |
| `/states`, `/states/:stateCode` | Tela "Busca por estado" (feature 002) |

- Escolher um município troca a URL com `router.replace` quando já há um
  município na URL e `router.push` quando não há, para que o botão voltar não
  empilhe cada escolha.
- Código inválido ou inexistente na URL: a API responde
  `INVALID_MUNICIPALITY_CODE` ou `MUNICIPALITY_NOT_FOUND`; a tela mostra a
  busca vazia com a mesma mensagem (FR-018).
- O menu fixo é um widget (`widgets/app-header`) por ser reusado pelas duas
  páginas (critério do ADR 0014).

**Motivo**: rotas em inglês (conventions.md); endereço identifica o recurso.

## R6. Autocomplete acessível

**Decisão**: componente Combobox do shadcn-vue (Reka UI), com:

- espera de 250 ms entre digitações antes de consultar (ADR 0017);
- consulta só com 2 ou mais caracteres após remover espaços das pontas;
- consultas de sugestões em cache pelo termo normalizado (vue-query,
  `staleTime: Infinity`);
- anúncio para leitor de tela da quantidade de sugestões.

**Motivo**: FR-002, FR-016; Reka UI entrega o padrão ARIA de combobox.

## R7. Sigla da UF

**Decisão**: tabela fixa código → sigla (27 entradas) no domínio, dentro do
Value Object `StateCode`.

**Motivo**: a base só tem código e nome da UF; a correspondência é estável
(códigos do IBGE).

## R8. Fonte tipográfica local

**Decisão**: Archivo via pacote `@fontsource-variable/archivo` 5.3.0, servida
pelo próprio frontend.

**Motivo**: sem requisição a serviço de terceiros (mesma linha do ADR 0017).
A confirmar na implementação: o pacote precisa expor o eixo de largura
(`wdth`) usado no sistema visual; se não expuser, a variação de largura é
substituída por peso e tamanho, registrada no `design-system.md`.

## R9. Fundação do projeto

A 001 é a primeira feature implementada; o plano inclui a fundação exigida
pelos ADRs, usada também pelas features 002 e 003:

- monorepo com workspaces e `@censo/contracts` (ADR 0013);
- backend Fastify com conexão somente leitura, `DATABASE_PATH`, verificação do
  arquivo (ponteiro LFS) e de migrations pendentes na inicialização
  (ADR 0005, 0015, 0018);
- migration `0001-baseline` (ADR 0015);
- frontend Vue com Tailwind, shadcn-vue, router, vue-query, fonte e tema do
  sistema visual;
- Docker Compose de produção e desenvolvimento (ADR 0005, 0018);
- lint, formatação e fronteiras (ADR 0011, 0014); Vitest e Playwright
  (ADR 0009).

## R10. Dependência da feature 003

As rotas desta feature passam a exigir sessão verificada quando a 003 for
implementada (ADR 0017). Os testes de rota e E2E da 001 precisam, a partir
daí, obter sessão antes de consultar; a ordem de implementação é definida na
etapa de tarefas.
