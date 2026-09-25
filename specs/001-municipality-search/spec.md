# Feature Specification: Busca de município

**Feature Branch**: `001-municipality-search` (sem branch; trabalho direto na `main`)

**Created**: 2026-09-25

**Status**: Draft

**Input**: Histórias US01 e US02 de `docs/user-stories.md`: encontrar um município pelo nome com sugestões enquanto digita e ver os indicadores agregados do município selecionado, na tela "Busca de cidades".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Encontrar um município pelo nome (Priority: P1)

O visitante abre a tela "Busca de cidades" e começa a digitar o nome de um município. Enquanto digita, a tela sugere municípios cujo nome corresponde ao que foi digitado, cada um acompanhado da sigla da UF. O visitante escolhe uma sugestão.

**Why this priority**: é a porta de entrada da tela. Sem encontrar o município, nenhum indicador pode ser exibido.

**Independent Test**: digitar partes de nomes conhecidos (com e sem acento, em maiúsculas e minúsculas) e verificar se as sugestões corretas aparecem, com a UF, e se é possível escolher uma delas.

**Acceptance Scenarios**:

1. **Given** o visitante abre o endereço principal da aplicação, **When** a página carrega, **Then** a tela "Busca de cidades" é exibida, com o menu no topo indicando essa tela.
2. **Given** a tela de busca aberta, **When** o visitante digita "sao pau", **Then** "São Paulo/SP" aparece entre as sugestões.
3. **Given** a tela de busca aberta, **When** o visitante digita "BOM JESUS", **Then** aparecem sugestões distintas para cada UF que tem um município com esse nome, cada uma identificada pela sigla da UF.
4. **Given** a tela de busca aberta, **When** o visitante digita um termo que não corresponde a nenhum município, **Then** a tela informa que nenhum município foi encontrado.
5. **Given** sugestões exibidas, **When** o visitante escolhe uma delas, **Then** o campo passa a mostrar o município escolhido com a UF e os indicadores desse município são exibidos (User Story 2).
6. **Given** a tela de busca aberta, **When** o visitante digita apenas 1 letra, **Then** nenhuma sugestão é exibida ainda.
7. **Given** a tela de busca aberta, **When** o visitante digita qualquer termo válido, **Then** nenhuma sugestão sem nome de município aparece (o registro sem nome da base nunca é sugerido).

---

### User Story 2 - Ver os indicadores de um município (Priority: P1)

Depois de escolher um município, o visitante vê abaixo da busca os números agregados daquele município: população total, quantidade de setores censitários, área total, densidade demográfica, divisão entre urbano e rural e distribuição da população por sexo.

**Why this priority**: é o resultado que o visitante procura. Junto com a User Story 1, forma o fluxo completo da tela.

**Independent Test**: escolher municípios com valores conhecidos (conferidos diretamente nos dados de origem) e comparar cada indicador exibido com o valor esperado, incluindo municípios com setores sem classificação urbano/rural e com população sem informação de sexo.

**Acceptance Scenarios**:

1. **Given** um município escolhido, **When** os indicadores são exibidos, **Then** aparecem população total, quantidade de setores, área total em km², densidade demográfica em habitantes por km², divisão urbano/rural e distribuição por sexo.
2. **Given** um município escolhido, **When** os indicadores são exibidos, **Then** todos os números seguem o formato brasileiro (separador de milhar ".", decimal ",").
3. **Given** um município com setores sem classificação urbano/rural, **When** a divisão urbano/rural é exibida, **Then** esses setores aparecem como uma categoria própria, "Sem classificação", e não são somados a urbano nem a rural.
4. **Given** um município com parte da população sem informação de sexo, **When** a distribuição por sexo é exibida, **Then** a distribuição mostra três categorias (homens, mulheres e "Sem informação"), com percentuais sobre a população total que somam 100%.
5. **Given** um município exibido, **When** o visitante escolhe outro município na busca, **Then** os indicadores são substituídos pelos do novo município.
6. **Given** um município exibido, **When** o visitante copia o endereço da página e o abre em outra aba ou recarrega a página, **Then** vê o mesmo município e os mesmos indicadores, sem digitar nada.
7. **Given** um município escolhido, **When** a densidade é exibida, **Then** ela aparece como número e também numa escala visual que situa o município entre densidades muito baixas e muito altas, a mesma escala usada no ranking da tela "Busca por estado".

---

### Edge Cases

- **Termo muito curto**: com menos de 2 caracteres, nenhuma sugestão é buscada.
- **Espaços e pontuação**: espaços no início e no fim são ignorados e espaços repetidos contam como um só; espaço, hífen e apóstrofo separam palavras para a busca ("arco" encontra "Pau D'Arco").
- **Nomes repetidos**: 232 nomes existem em mais de uma UF; a sigla da UF sempre acompanha o nome, na sugestão e no município escolhido.
- **Registro sem nome**: existe um registro de município sem nome (código ".", RS, população 0); ele nunca aparece nas sugestões.
- **Setores sem classificação urbano/rural**: 1.103 setores, em 555 municípios, não têm classificação; entram na contagem total de setores e na área total, e aparecem como "Sem classificação" na divisão urbano/rural.
- **População sem informação de sexo**: em 2.229 municípios, homens + mulheres é menor que a população total (519.640 pessoas no total, provavelmente por sigilo na origem).
- **Faixa de valores**: densidades vão de cerca de 0,15 a 13.417 hab/km²; o formato de exibição precisa ser legível nos dois extremos.
- **Falha ao carregar**: se os indicadores não puderem ser carregados, a tela informa o problema e permite tentar de novo, sem perder o município escolhido.
- **Endereço inválido**: um endereço com código de município inexistente ou em formato inválido (letras, tamanho errado) mostra a busca vazia e informa que o endereço não corresponde a nenhum município.
- **Respostas fora de ordem**: se o visitante digita rápido, só as sugestões do termo atual do campo são exibidas.
- **Município com uma só categoria de área**: Urbano e Rural aparecem sempre, mesmo com zero.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE oferecer um campo de busca de município por nome na tela "Busca de cidades".
- **FR-002**: O sistema DEVE sugerir municípios enquanto o visitante digita, a partir de 2 caracteres, contados após remover os espaços das pontas; termos com mais de 60 caracteres não são buscados.
- **FR-003**: A busca DEVE ignorar diferenças de acento e de maiúsculas/minúsculas.
- **FR-004**: A busca DEVE encontrar municípios cujo nome tenha alguma palavra começando pelo termo digitado, considerando espaço, hífen e apóstrofo como separadores de palavras ("paulo" encontra "São Paulo" e "Paulo Afonso"; "aulo" não encontra nenhum; "arco" encontra "Pau D'Arco").
- **FR-005**: Cada sugestão DEVE exibir o nome do município e a sigla da UF no formato "Nome/SIGLA" (ex.: "São Paulo/SP"); o mesmo formato é usado no município escolhido.
- **FR-006**: O sistema DEVE exibir no máximo 10 sugestões por vez, primeiro os nomes que começam com o termo digitado e depois os demais; dentro de cada grupo, em ordem alfabética pela regra do português (acentos ordenados como a letra base) e, em nomes iguais, pela sigla da UF.
- **FR-007**: O sistema DEVE informar quando nenhum município corresponde ao termo digitado.
- **FR-008**: O sistema NÃO DEVE sugerir registros de município sem nome.
- **FR-009**: Ao escolher um município, o sistema DEVE exibir: população total (soma da população dos setores do município); quantidade de setores censitários; área total em km²; densidade demográfica (população total dividida pela área total) em hab/km²; divisão urbano/rural; distribuição da população por sexo.
- **FR-010**: A divisão urbano/rural DEVE apresentar, para cada categoria (Urbano, Rural e "Sem classificação"), a quantidade de setores e a população, cada uma com seu percentual sobre o total do município; Urbano e Rural aparecem sempre, mesmo com zero, e "Sem classificação" só quando houver setores sem classificação.
- **FR-011**: A distribuição por sexo DEVE exibir três categorias (Homens, Mulheres e "Sem informação"), com quantidade e percentual sobre a população total; a categoria "Sem informação" é exibida apenas quando for maior que zero.
- **FR-012**: Todos os números exibidos DEVEM seguir o formato brasileiro: população e contagens sem casas decimais; área e densidade com 2 casas decimais; percentuais com 1 casa decimal; os percentuais de cada distribuição somam exatamente 100,0%.
- **FR-013**: Todos os textos da tela DEVEM estar em português do Brasil.
- **FR-014**: Ao escolher outro município, o sistema DEVE substituir os indicadores exibidos pelos do novo município.
- **FR-015**: Em caso de falha ao buscar sugestões ou indicadores, o sistema DEVE informar o problema em linguagem simples e permitir nova tentativa, sem perder o termo digitado nem o município escolhido.
- **FR-016**: A tela DEVE ser utilizável por teclado (setas percorrem as sugestões; Enter escolhe a sugestão destacada ou, sem destaque, a primeira; Esc fecha a lista), em telas a partir de 360px de largura e com leitores de tela (quantidade de sugestões anunciada; valores das barras de proporção disponíveis em texto), com foco visível e contraste de texto no nível AA.
- **FR-017**: Ao escolher um município, o endereço da página DEVE passar a identificá-lo; abrir esse endereço (por link compartilhado, favorito ou recarga) DEVE exibir diretamente o município com a UF no campo de busca e seus indicadores.
- **FR-018**: Um endereço com código de município inexistente ou em formato inválido DEVE exibir a busca vazia com a mensagem de que o endereço não corresponde a nenhum município.
- **FR-019**: O endereço principal da aplicação DEVE abrir a tela "Busca de cidades".
- **FR-020**: A tela DEVE ter um menu fixo no topo, igual nas duas telas, com acesso à "Busca de cidades" e à "Busca por estado", indicando a tela atual.
- **FR-021**: Enquanto sugestões ou indicadores carregam, a tela DEVE indicar o carregamento, mantendo visíveis os rótulos dos indicadores.
- **FR-022**: As sugestões exibidas DEVEM corresponder sempre ao termo atual do campo; resultados de termos anteriores são descartados.
- **FR-023**: A tela DEVE seguir os estados de verificação, falha de verificação e bloqueio definidos na funcionalidade 003 (spec 003, FR-006, FR-007 e FR-009): campos desabilitados, com a explicação correspondente, enquanto a verificação acontece ou o bloqueio dura.
- **FR-024**: A tela DEVE exibir a fonte dos dados: "Fonte: IBGE, Censo Demográfico 2022".
- **FR-025**: Escolher outro município DEVE substituir o endereço atual no histórico do navegador; o botão voltar leva à página visitada antes da busca, não a cada município consultado.
- **FR-026**: O título da aba do navegador DEVE incluir o município escolhido (ex.: "São Paulo/SP - Censo 2022").
- **FR-027**: A densidade DEVE ser acompanhada de uma escala visual que situa o município entre densidades muito baixas e muito altas; a escala é a mesma do ranking da funcionalidade 002, é complementar e não substitui o valor numérico.

### Key Entities *(include if feature involves data)*

- **UF (unidade federativa)**: estado ou Distrito Federal; tem código, nome e sigla. As 27 UFs são fixas.
- **Município**: pertence a uma UF; tem código e nome. O nome pode se repetir entre UFs.
- **Setor censitário**: menor unidade territorial do censo; pertence a um município; tem classificação urbano, rural ou nenhuma, área em km² e população.
- **Demografia do setor**: moradores, homens e mulheres de um setor; pode faltar para setores sem população e ter valores ausentes por sigilo.
- **Indicadores do município**: valores agregados de todos os setores do município (população total, quantidade de setores, área total, densidade, divisão urbano/rural, distribuição por sexo).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em pelo menos 25 das 27 capitais, a capital aparece entre as sugestões digitando no máximo 5 caracteres do início do nome.
- **SC-002**: As sugestões aparecem em até 1 segundo após o visitante parar de digitar (um quarto de segundo sem nova tecla), com a aplicação rodando localmente como definido para a v1.
- **SC-003**: Os indicadores aparecem em até 1 segundo após a escolha do município, nas mesmas condições do SC-002.
- **SC-004**: 100% dos indicadores exibidos coincidem com os valores calculados diretamente a partir dos dados de origem, em uma amostra de municípios que inclui: capitais, municípios com nome repetido, com setores sem classificação e com população sem informação de sexo.
- **SC-005**: O fluxo completo (digitar, escolher, ver indicadores) funciona apenas com teclado e em tela de celular.

## Clarifications

### Session 2026-09-25

- Q: A divisão urbano/rural mostra a quantidade de setores, a população ou os dois? → A: Os dois, com percentuais, incluindo "Sem classificação".
- Q: Como exibir a população sem informação de sexo? → A: Três categorias (homens, mulheres, "Sem informação") com percentuais sobre a população total.
- Q: Como o termo digitado corresponde ao nome? → A: Início de qualquer palavra do nome.
- Q: O endereço da página deve identificar o município escolhido, permitindo compartilhar o link e recarregar sem perder o resultado? → A: Sim; abrir esse endereço mostra direto os indicadores do município.
- Q: Qual tela o visitante vê ao abrir o endereço principal, e como passa de uma para a outra? → A: O endereço principal abre a "Busca de cidades"; um menu fixo no topo, nas duas telas, leva a qualquer uma delas.

### Session 2026-09-25 (revisão dos checklists)

- Q: Como exibir município e UF juntos? → A: "Nome/SIGLA" (ex.: "São Paulo/SP").
- Q: A tela identifica a fonte dos dados? → A: Sim: "Fonte: IBGE, Censo Demográfico 2022".
- Q: A escala visual de densidade também é requisito nesta tela? → A: Sim, a mesma escala do ranking da 002, complementar ao número.

## Assumptions

- A verificação contra bots e o limite de consultas são tratados na funcionalidade 003; os estados que eles produzem nesta tela estão no FR-023.
- Os dados são somente leitura e não mudam durante o uso; não há atualização de dados nesta funcionalidade.
- O código do município e o código dos setores não são exibidos ao visitante, a menos que o plano de design indique o contrário.
- A sigla da UF é derivada do código da UF (por exemplo, 35 → SP) para os 27 códigos, já que a origem traz apenas código e nome.
- A fonte dos dados é o Censo Demográfico 2022 do IBGE: o total de população da base (203.080.756) coincide com o resultado oficial, e a fonte foi confirmada pelo responsável.
- A área total do município é a soma das áreas de seus setores; a densidade usa essa área total.
- O visual da tela é definido no plano de design da funcionalidade; esta spec define apenas conteúdo e comportamento.
- O fluxo desta tela é validado por um teste de ponta a ponta próprio.
