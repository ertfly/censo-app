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

1. **Given** qualquer uma das telas aberta, **When** o visitante escolhe "Busca por estado" no menu do topo, **Then** esta tela é exibida, com o menu indicando a tela atual.
2. **Given** a tela aberta, **When** o visitante abre a lista de UFs, **Then** as 27 UFs aparecem em ordem alfabética, cada uma com nome e sigla.
3. **Given** uma UF escolhida, **When** o ranking é exibido, **Then** os municípios aparecem do maior para o menor em densidade demográfica.
4. **Given** o ranking exibido, **When** o visitante lê uma linha, **Then** vê a posição, o nome do município, a população, a área em km² e a densidade em hab/km².
5. **Given** uma UF exibida, **When** o visitante escolhe outra UF, **Then** o ranking e os totais são substituídos pelos da nova UF.
6. **Given** a UF Rio Grande do Sul escolhida, **When** o ranking é exibido, **Then** o registro de município sem nome não aparece como linha do ranking.
7. **Given** o Distrito Federal escolhido, **When** o ranking é exibido, **Then** aparece uma única linha, na posição 1.
8. **Given** uma UF exibida, **When** o visitante copia o endereço da página e o abre em outra aba ou recarrega a página, **Then** vê a mesma UF, com os mesmos totais e ranking, sem escolher nada.
9. **Given** o ranking de Minas Gerais exibido, **When** o visitante digita "juiz" no filtro, **Then** aparece apenas "Juiz de Fora", com a mesma posição que ocupa no ranking completo.
10. **Given** um filtro aplicado, **When** o visitante apaga o termo, **Then** o ranking completo volta a ser exibido.
11. **Given** o ranking de Minas Gerais exibido, **When** o visitante observa "Águas Vermelhas" e "Luminárias", que aparecem com a mesma densidade arredondada (11,17 hab/km²), **Then** "Águas Vermelhas" vem antes, porque sua densidade sem arredondamento é maior, e cada um tem a sua própria posição.

---

### User Story 2 - Ver os números agregados da UF (Priority: P1)

Junto ao ranking, o visitante vê os totais da UF escolhida: população total, área total e densidade demográfica.

**Why this priority**: sem a referência da UF, não há como saber se um município está acima ou abaixo da ocupação média do estado.

**Independent Test**: escolher UFs e comparar população total, área total e densidade exibidas com os valores calculados diretamente a partir dos dados de origem.

**Acceptance Scenarios**:

1. **Given** uma UF escolhida, **When** os totais são exibidos, **Then** aparecem população total, área total em km² e densidade em hab/km².
2. **Given** uma UF escolhida, **When** os totais são exibidos, **Then** a densidade da UF é a população total dividida pela área total, e não a média das densidades dos municípios.
3. **Given** os totais e o ranking exibidos, **When** o visitante compara os números, **Then** a população total da UF é igual à soma das populações do ranking.
4. **Given** a UF Rio Grande do Sul escolhida, **When** os totais são exibidos, **Then** a área total é 281.707,15 km², acompanhada da informação de que 13.085,86 km² estão fora dos municípios, e a soma das áreas do ranking é menor que a área total.

---

### Edge Cases

- **UF com um município**: o Distrito Federal tem um único município; o ranking mostra uma linha e os totais da UF coincidem com os dele.
- **UF com muitos municípios**: Minas Gerais tem 853 municípios; a tela precisa continuar legível e navegável.
- **Registro sem nome**: o registro de município sem nome (RS, população 0) não entra como linha do ranking, mas sua área entra na área total do RS (FR-009). Por isso, no RS, a soma das áreas do ranking é menor que a área total da UF.
- **Densidades iguais na exibição**: 181 pares de municípios da mesma UF têm a mesma densidade quando arredondada para 2 casas; a ordem segue o valor não arredondado e, em empate exato, o nome em ordem alfabética; a tela não sinaliza esses casos de forma especial.
- **Faixa de valores**: densidades de cerca de 0,15 a 13.417 hab/km² na mesma tabela; a formatação precisa ser legível nos dois extremos.
- **Falha ao carregar**: se o ranking ou os totais não puderem ser carregados, a tela informa o problema e permite tentar de novo, sem perder a UF escolhida.
- **Endereço inválido**: um endereço com código de UF inexistente ou em formato inválido mostra a tela sem UF escolhida e informa que o endereço não corresponde a nenhuma unidade federativa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE oferecer, na tela "Busca por estado", a escolha de uma entre as 27 UFs, listadas em ordem alfabética pelo nome segundo a regra do português (acentos ordenados como a letra base), cada uma no formato "Nome/SIGLA" usado na funcionalidade 001 (ex.: "Minas Gerais/MG").
- **FR-002**: Ao escolher uma UF, o sistema DEVE exibir os municípios dessa UF ordenados por densidade demográfica decrescente.
- **FR-003**: A densidade de cada município DEVE ser a população total dividida pela área total, ambas somadas a partir dos setores do município (mesma regra da funcionalidade 001).
- **FR-004**: Em empate exato de densidade, a ordem DEVE seguir o nome do município em ordem alfabética, pela mesma regra do português do FR-001.
- **FR-005**: Cada linha do ranking DEVE exibir: posição, nome do município, população, área em km², densidade em hab/km² e uma escala visual da densidade do município, com a densidade da UF marcada como referência; a escala é complementar e não substitui o valor numérico.
- **FR-006**: O ranking DEVE apresentar todos os municípios da UF de uma vez, em lista com rolagem, sem paginação.
- **FR-007**: O sistema NÃO DEVE exibir registros de município sem nome como linhas do ranking.
- **FR-008**: O sistema DEVE exibir, para a UF escolhida: população total, área total em km² e densidade (população total dividida pela área total). Quando a área total incluir áreas fora de municípios (registro sem nome), a tela DEVE informar esse valor junto à área total.
- **FR-009**: A área total e a população total da UF DEVEM somar todos os setores da UF, inclusive os do registro sem nome (área total do RS: 281.707,15 km², igual à área oficial divulgada pelo IBGE).
- **FR-010**: As linhas do ranking são apenas para leitura; escolher um município no ranking NÃO leva a outra tela. As telas "Busca por estado" e "Busca de cidades" são independentes.
- **FR-011**: Todos os números DEVEM seguir o formato brasileiro, com as mesmas regras da funcionalidade 001: população e posições sem casas decimais; área e densidade com 2 casas decimais.
- **FR-012**: Todos os textos da tela DEVEM estar em português do Brasil.
- **FR-013**: Ao escolher outra UF, o sistema DEVE substituir o ranking e os totais pelos da nova UF.
- **FR-014**: Em caso de falha ao carregar o ranking ou os totais, o sistema DEVE informar o problema em linguagem simples e permitir nova tentativa, sem perder a UF escolhida nem o termo do filtro.
- **FR-015**: A tela DEVE ser utilizável por teclado, em telas a partir de 360px de largura e com leitores de tela: o ranking é uma tabela com cabeçalhos associados às células, o cabeçalho continua visível ao rolar, a quantidade de resultados do filtro é anunciada, o foco é visível e o contraste de texto atinge o nível AA. Em celular, cada município ocupa um item com posição e nome na primeira linha e os valores na segunda.
- **FR-016**: A tela DEVE ter o mesmo menu fixo no topo da tela "Busca de cidades", com acesso às duas telas e indicando a tela atual.
- **FR-017**: Ao escolher uma UF, o endereço da página DEVE passar a identificá-la; abrir esse endereço (por link compartilhado, favorito ou recarga) DEVE exibir diretamente a UF escolhida, seus totais e o ranking. O termo do filtro não faz parte do endereço.
- **FR-018**: Um endereço com código de UF inexistente ou em formato inválido DEVE exibir a tela sem UF escolhida, com a mensagem de que o endereço não corresponde a nenhuma unidade federativa.
- **FR-019**: O ranking DEVE ter um campo de filtro por nome de município que atua a partir do primeiro caractere, ignora acento e maiúsculas e encontra o termo no início de qualquer palavra do nome, com espaço, hífen e apóstrofo como separadores (mesma regra do FR-004 da funcionalidade 001).
- **FR-020**: Com o filtro aplicado, cada linha exibida DEVE manter a posição original no ranking completo da UF; os totais da UF não mudam.
- **FR-021**: Quando o filtro não encontrar nenhum município, a tela DEVE informar que nenhum município da UF corresponde ao termo.
- **FR-022**: Ao trocar de UF, o filtro DEVE ser limpo e o ranking DEVE voltar ao início.
- **FR-023**: A tela DEVE exibir a quantidade de municípios listados: o total da UF (ex.: "853 municípios") e, com filtro, quantos correspondem (ex.: "3 de 853 municípios").
- **FR-024**: Antes de escolher uma UF, a tela DEVE orientar o visitante a escolher uma unidade federativa para ver o ranking.
- **FR-025**: Enquanto o ranking e os totais carregam, a tela DEVE indicar o carregamento, mantendo visíveis os rótulos dos totais.
- **FR-026**: A tela DEVE seguir os estados de verificação, falha de verificação e bloqueio definidos na funcionalidade 003 (spec 003, FR-006, FR-007 e FR-009), como a tela "Busca de cidades".
- **FR-027**: A tela DEVE exibir a fonte dos dados: "Fonte: IBGE, Censo Demográfico 2022".
- **FR-028**: Escolher outra UF DEVE substituir o endereço atual no histórico do navegador, como na funcionalidade 001; o título da aba DEVE incluir a UF escolhida (ex.: "Minas Gerais/MG - Censo 2022").

### Key Entities *(include if feature involves data)*

- **UF (unidade federativa)**: estado ou Distrito Federal; tem código, nome e sigla. As 27 UFs são fixas.
- **Município**: pertence a uma UF; tem código e nome.
- **Setor censitário**: menor unidade territorial do censo; pertence a um município; tem área em km² e população.
- **Linha do ranking**: um município da UF com posição, população, área e densidade.
- **Totais da UF**: população total, área total e densidade, calculados a partir dos setores da UF.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O ranking e os totais aparecem em até 1 segundo após a escolha da UF, inclusive para Minas Gerais (853 municípios), com a aplicação rodando localmente como definido para a v1.
- **SC-002**: 100% das posições do ranking coincidem com a ordem calculada diretamente a partir dos dados de origem, em todas as 27 UFs.
- **SC-003**: 100% dos totais exibidos (população, área, densidade) coincidem com os valores calculados diretamente a partir dos dados de origem, em todas as 27 UFs.
- **SC-004**: Usando o filtro, o visitante encontra a posição de um município específico no ranking de Minas Gerais em até 30 segundos, em teste com pelo menos 5 municípios escolhidos ao acaso.
- **SC-005**: O fluxo completo (escolher UF, ler totais, percorrer o ranking) funciona apenas com teclado e em tela de celular.

## Clarifications

### Session 2026-09-25

- Q: O ranking mostra todos os municípios, paginado ou só os N primeiros? → A: Todos de uma vez, com rolagem.
- Q: A área total da UF inclui a área do registro sem nome? → A: Inclui; totais da UF somam todos os setores (RS = 281.707,15 km², igual ao dado oficial).
- Q: O município do ranking leva à tela "Busca de cidades"? → A: Não; o ranking é só leitura e as telas são independentes.
- Q: Como o visitante chega a esta tela e passa para a outra? → A: Por um menu fixo no topo, igual nas duas telas (decidido no clarify da spec 001; o endereço principal abre a "Busca de cidades").
- Q: O endereço da página deve identificar a UF escolhida, permitindo compartilhar o link e recarregar sem perder o ranking? → A: Sim; abrir esse endereço mostra direto o ranking e os totais da UF.
- Q: Além de rolar, o visitante deve poder filtrar o ranking pelo nome do município, mantendo a posição original? → A: Sim; filtro por nome, ignorando acento e maiúsculas, com a posição original preservada.

### Session 2026-09-25 (revisão dos checklists)

- Q: Como exibir nome e sigla juntos? → A: "Nome/SIGLA", como na funcionalidade 001 (ex.: "Minas Gerais/MG").
- Q: A coluna de escala visual fica no ranking? → A: Sim, como complemento do valor numérico, com a densidade da UF como referência.
- Q: A tela identifica a fonte dos dados? → A: Sim: "Fonte: IBGE, Censo Demográfico 2022".

## Assumptions

- A verificação contra bots e o limite de consultas são tratados na funcionalidade 003; os estados que eles produzem nesta tela estão no FR-026.
- O filtro atua sobre os municípios já exibidos e não faz novas consultas; por isso não consome o limite de consultas da funcionalidade 003.
- Os dados são somente leitura e não mudam durante o uso.
- A sigla da UF é derivada do código da UF, como na funcionalidade 001.
- Nenhuma UF vem pré-selecionada ao abrir a tela; os totais e o ranking aparecem após a escolha.
- A posição exibida é sequencial (1, 2, 3...), sem posições repetidas em empates.
- O visual da tela é definido no plano de design da funcionalidade; esta spec define apenas conteúdo e comportamento.
- O fluxo desta tela é validado por um teste de ponta a ponta próprio.
