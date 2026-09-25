# Feature Specification: Ranking por estado

**Feature Branch**: `002-state-ranking` (sem branch; trabalho direto na `main`)

**Created**: 2026-09-25

**Status**: Draft

**Input**: Histórias US03 e US04 de `docs/user-stories.md`: escolher uma unidade federativa e ver seus municípios ranqueados por densidade demográfica, do mais denso para o menos denso, junto com os números agregados da UF, na tela "Busca por estado".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver os municípios de uma UF ranqueados por densidade (Priority: P1)

O visitante abre a tela "Busca por estado", escolhe uma UF em uma lista e vê os municípios dessa UF ordenados do mais denso para o menos denso.

**Why this priority**: é o objetivo principal da tela: comparar a ocupação do território entre os municípios de um estado.

**Independent Test**: escolher UFs com quantidades de municípios muito diferentes (DF com 1, RR com 15, MG com 853) e verificar se todos os municípios aparecem na ordem correta de densidade, conferida diretamente nos dados de origem.

**Acceptance Scenarios**:

1. **Given** a tela aberta, **When** o visitante abre a lista de UFs, **Then** as 27 UFs aparecem em ordem alfabética, cada uma com nome e sigla.
2. **Given** uma UF escolhida, **When** o ranking é exibido, **Then** os municípios aparecem do maior para o menor em densidade demográfica.
3. **Given** o ranking exibido, **When** o visitante lê uma linha, **Then** vê a posição, o nome do município, a população, a área em km² e a densidade em hab/km².
4. **Given** uma UF exibida, **When** o visitante escolhe outra UF, **Then** o ranking e os totais são substituídos pelos da nova UF.
5. **Given** a UF Rio Grande do Sul escolhida, **When** o ranking é exibido, **Then** o registro de município sem nome não aparece como linha do ranking.
6. **Given** o Distrito Federal escolhido, **When** o ranking é exibido, **Then** aparece uma única linha, na posição 1.

---

### User Story 2 - Ver os números agregados da UF (Priority: P1)

Junto ao ranking, o visitante vê os totais da UF escolhida: população total, área total e densidade demográfica.

**Why this priority**: sem a referência da UF, não há como saber se um município está acima ou abaixo da ocupação média do estado.

**Independent Test**: escolher UFs e comparar população total, área total e densidade exibidas com os valores calculados diretamente a partir dos dados de origem.

**Acceptance Scenarios**:

1. **Given** uma UF escolhida, **When** os totais são exibidos, **Then** aparecem população total, área total em km² e densidade em hab/km².
2. **Given** uma UF escolhida, **When** os totais são exibidos, **Then** a densidade da UF é a população total dividida pela área total, e não a média das densidades dos municípios.
3. **Given** os totais e o ranking exibidos, **When** o visitante compara os números, **Then** a população total da UF é igual à soma das populações do ranking.

---

### Edge Cases

- **UF com um município**: o Distrito Federal tem um único município; o ranking mostra uma linha e os totais da UF coincidem com os dele.
- **UF com muitos municípios**: Minas Gerais tem 853 municípios; a tela precisa continuar legível e navegável.
- **Registro sem nome**: o registro de município sem nome (RS, população 0) não entra como linha do ranking, mas sua área entra na área total do RS (FR-009). Por isso, no RS, a soma das áreas do ranking é menor que a área total da UF.
- **Densidades iguais na exibição**: 181 pares de municípios da mesma UF têm a mesma densidade quando arredondada para 2 casas; a ordem segue o valor não arredondado e, em empate exato, o nome em ordem alfabética.
- **Faixa de valores**: densidades de cerca de 0,15 a 13.417 hab/km² na mesma tabela; a formatação precisa ser legível nos dois extremos.
- **Falha ao carregar**: se o ranking ou os totais não puderem ser carregados, a tela informa o problema e permite tentar de novo, sem perder a UF escolhida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE oferecer, na tela "Busca por estado", a escolha de uma entre as 27 UFs, listadas em ordem alfabética pelo nome, cada uma com nome e sigla.
- **FR-002**: Ao escolher uma UF, o sistema DEVE exibir os municípios dessa UF ordenados por densidade demográfica decrescente.
- **FR-003**: A densidade de cada município DEVE ser a população total dividida pela área total, ambas somadas a partir dos setores do município (mesma regra da funcionalidade 001).
- **FR-004**: Em empate exato de densidade, a ordem DEVE seguir o nome do município em ordem alfabética.
- **FR-005**: Cada linha do ranking DEVE exibir: posição, nome do município, população, área em km² e densidade em hab/km².
- **FR-006**: O ranking DEVE apresentar todos os municípios da UF de uma vez, em lista com rolagem, sem paginação.
- **FR-007**: O sistema NÃO DEVE exibir registros de município sem nome como linhas do ranking.
- **FR-008**: O sistema DEVE exibir, para a UF escolhida: população total, área total em km² e densidade (população total dividida pela área total).
- **FR-009**: A área total e a população total da UF DEVEM somar todos os setores da UF, inclusive os do registro sem nome (área total do RS: 281.707,15 km², igual à área oficial divulgada pelo IBGE).
- **FR-010**: As linhas do ranking são apenas para leitura; escolher um município no ranking NÃO leva a outra tela. As telas "Busca por estado" e "Busca de cidades" são independentes.
- **FR-011**: Todos os números DEVEM seguir o formato brasileiro, com as mesmas regras da funcionalidade 001: população e posições sem casas decimais; área e densidade com 2 casas decimais.
- **FR-012**: Todos os textos da tela DEVEM estar em português do Brasil.
- **FR-013**: Ao escolher outra UF, o sistema DEVE substituir o ranking e os totais pelos da nova UF.
- **FR-014**: Em caso de falha ao carregar o ranking ou os totais, o sistema DEVE informar o problema em linguagem simples e permitir nova tentativa.
- **FR-015**: A tela DEVE ser utilizável por teclado e em telas de celular, inclusive a leitura do ranking.

### Key Entities *(include if feature involves data)*

- **UF (unidade federativa)**: estado ou Distrito Federal; tem código, nome e sigla. As 27 UFs são fixas.
- **Município**: pertence a uma UF; tem código e nome.
- **Setor censitário**: menor unidade territorial do censo; pertence a um município; tem área em km² e população.
- **Linha do ranking**: um município da UF com posição, população, área e densidade.
- **Totais da UF**: população total, área total e densidade, calculados a partir dos setores da UF.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O ranking e os totais aparecem em até 1 segundo após a escolha da UF, inclusive para Minas Gerais (853 municípios).
- **SC-002**: 100% das posições do ranking coincidem com a ordem calculada diretamente a partir dos dados de origem, em todas as 27 UFs.
- **SC-003**: 100% dos totais exibidos (população, área, densidade) coincidem com os valores calculados diretamente a partir dos dados de origem, em todas as 27 UFs.
- **SC-004**: O visitante encontra a posição de um município específico no ranking de Minas Gerais em até 30 segundos.
- **SC-005**: O fluxo completo (escolher UF, ler totais, percorrer o ranking) funciona apenas com teclado e em tela de celular.

## Clarifications

### Session 2026-09-25

- Q: O ranking mostra todos os municípios, paginado ou só os N primeiros? → A: Todos de uma vez, com rolagem.
- Q: A área total da UF inclui a área do registro sem nome? → A: Inclui; totais da UF somam todos os setores (RS = 281.707,15 km², igual ao dado oficial).
- Q: O município do ranking leva à tela "Busca de cidades"? → A: Não; o ranking é só leitura e as telas são independentes.

## Assumptions

- A verificação contra bots e o limite de consultas são tratados na funcionalidade 003; esta spec assume uma sessão já verificada.
- Os dados são somente leitura e não mudam durante o uso.
- A sigla da UF é derivada do código da UF, como na funcionalidade 001.
- Nenhuma UF vem pré-selecionada ao abrir a tela; os totais e o ranking aparecem após a escolha.
- A posição exibida é sequencial (1, 2, 3...), sem posições repetidas em empates.
- O visual da tela é definido no plano de design da funcionalidade; esta spec define apenas conteúdo e comportamento.
- O fluxo desta tela é validado por um teste de ponta a ponta próprio.
