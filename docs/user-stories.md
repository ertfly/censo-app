# Histórias de usuário: v1

Backlog da primeira versão. Cada funcionalidade vira uma spec do spec-kit em
`specs/NNN-nome/`. Os critérios descrevem o comportamento esperado, sem
detalhes técnicos. As perguntas em aberto são resolvidas no `/speckit-clarify`
de cada funcionalidade.

## Atores

| Ator | Descrição |
|---|---|
| Visitante | Qualquer pessoa que acessa a página para consultar dados, sem cadastro |
| Responsável | Quem mantém e opera a aplicação |

## Visão geral

| # | Funcionalidade | Tela | Histórias | Pasta da spec |
|---|---|---|---|---|
| 1 | Busca de município | Busca de cidades | US01, US02 | `specs/001-municipality-search/` |
| 2 | Ranking por estado | Busca por estado | US03, US04 | `specs/002-state-ranking/` |
| 3 | Proteção contra bots | Transversal (as duas telas) | US05, US06 | `specs/003-bot-protection/` |

Cada tela é um fluxo de teste de ponta a ponta.

## 1. Busca de município

### US01: Encontrar um município pelo nome

Como visitante, quero digitar o nome de um município e receber sugestões
enquanto digito, para encontrá-lo sem precisar escrever o nome completo.

Critérios de aceite:

- As sugestões aparecem enquanto o visitante digita.
- A busca ignora acentos e maiúsculas ("sao paulo" encontra "São Paulo").
- Cada sugestão mostra o nome do município e a UF.
- Municípios com o mesmo nome em UFs diferentes aparecem como sugestões
  distintas ("Bom Jesus" existe em 5 UFs).
- Sem resultado, a tela informa que nenhum município foi encontrado.

Perguntas em aberto:

- A partir de quantas letras as sugestões aparecem?
- Quantas sugestões no máximo?
- A busca encontra o termo em qualquer parte do nome ou só no início?

### US02: Ver os indicadores de um município

Como visitante, quero selecionar um município e ver seus números agregados,
para conhecer o perfil da população e do território.

Critérios de aceite:

- Ao selecionar um município, os indicadores aparecem abaixo da busca:
  - população total;
  - quantidade de setores censitários;
  - área total (km²);
  - densidade demográfica (habitantes por km²);
  - divisão entre setores urbanos e rurais;
  - distribuição da população por sexo.
- Números, áreas e percentuais seguem o formato brasileiro (`203.080.756`,
  `0,54 km²`, `51,5%`).

Perguntas em aberto:

- A divisão urbano/rural mostra a quantidade de setores, a população ou os
  dois?
- Como exibir os 1.103 setores sem classificação urbana/rural?
- A distribuição por sexo não soma a população total em 2.229 municípios
  (519.640 pessoas sem informação de sexo, provavelmente por sigilo na origem).
  Como exibir a parte sem informação?
- Com quantas casas decimais a densidade e a área são exibidas?

## 2. Ranking por estado

### US03: Ver os municípios de uma UF ranqueados por densidade

Como visitante, quero escolher uma unidade federativa e ver seus municípios
ordenados do mais denso para o menos denso, para comparar a ocupação do
território.

Critérios de aceite:

- O visitante escolhe uma UF em uma lista com as 27 UFs.
- Os municípios da UF aparecem ordenados por densidade demográfica, do maior
  para o menor.
- Cada linha mostra a posição, o nome do município e a densidade.

Perguntas em aberto:

- A lista mostra todos os municípios de uma vez ou é paginada (MG tem 853)?
- Além da densidade, cada linha mostra população e área?
- Como desempatar municípios com a mesma densidade?

### US04: Ver os números agregados da UF

Como visitante, quero ver os totais da UF escolhida, para ter a referência do
estado ao comparar os municípios.

Critérios de aceite:

- Junto ao ranking aparecem, para a UF inteira:
  - população total;
  - área total (km²);
  - densidade demográfica.
- Formatação brasileira, como na US02.

Perguntas em aberto:

- A densidade da UF é a população total dividida pela área total? (Não é a
  média das densidades dos municípios.)

## 3. Proteção contra bots

### US05: Consultar sem cadastro

Como visitante, quero usar as consultas sem criar conta nem informar e-mail,
com uma verificação automática que não atrapalhe o uso.

Critérios de aceite:

- Nenhuma tela pede cadastro, login ou e-mail.
- A verificação acontece uma vez ao abrir a página e, na maioria dos casos,
  sem interação do visitante.
- Durante a sessão, o visitante não é verificado de novo a cada consulta.
- Quando a sessão expira, a verificação acontece de novo sem perder o que o
  visitante estava fazendo.
- Se a verificação falhar, a tela explica o que aconteceu e como tentar de
  novo.

### US06: Limitar acessos automatizados

Como responsável, quero que consultas automatizadas em massa sejam limitadas,
para que a aplicação continue disponível para os visitantes.

Critérios de aceite:

- Um mesmo acesso que ultrapassa o limite de consultas por período é
  bloqueado temporariamente.
- O visitante bloqueado vê uma mensagem clara, em português, informando que
  deve aguardar.
- Robôs de IA que se identificam são recusados.
- O uso normal (digitar no autocomplete, trocar de UF) não atinge o limite.

Perguntas em aberto:

- Qual a duração da sessão?
- Qual o limite de consultas por período?

## Casos de dados que afetam as duas telas

Levantados em [database.md](../.harness/database.md#qualidade-dos-dados):

- Existe um registro de município com código `.` e nome vazio (RS), com 2
  setores de população 0. Aparece na busca? Entra no ranking do RS?
