# Design: tela "Busca de cidades"

Layout da tela. Cor, tipografia, forma e movimento seguem o
[sistema visual](../../.harness/design-system.md). Plano feito com a skill
`frontend-design` (Princípio IX).

## Ideia

A tela é uma **ficha municipal**: o visitante preenche um único campo (o nome)
e a ficha se completa abaixo, como a folha do recenseador. O elemento
memorável é a **escala de densidade**, uma régua logarítmica em que o marcador
do município desliza até sua posição entre o sertão mais vazio e o centro
urbano mais denso do país. Todo o resto fica sóbrio.

## Estrutura (desktop, ≥ 1024px)

Conteúdo alinhado à esquerda, largura máxima de 72rem, grade de 12 colunas.

```
┌──────────────────────────────────────────────────────────────────────┐
│ Censo 2022      Busca de cidades   Busca por estado                  │ menu fixo
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Município                                                            │
│ ┌──────────────────────────────────────────┐                         │
│ │ campinas                                 │  campo grande (8 col.)  │
│ └──────────────────────────────────────────┘                         │
│                                                                      │
│ Campinas/SP                          ← título, largura expandida      │
│                                                                      │
│ ┌─────────────────────┬─────────────────────┬──────────────────────┐ │
│ │ População           │ Setores censitários │ Área                 │ │
│ │ 1.139.047           │ 2.345               │ 794,57 km²           │ │
│ ├─────────────────────┴─────────────────────┴──────────────────────┤ │
│ │ Densidade demográfica                                1.433,51 hab/km² │
│ │ 0,1 ──┼──────┼──────┼──────┼──────●┼────── 100.000               │ │
│ │       1      10     100    1.000   10.000                        │ │
│ ├──────────────────────────────────┬───────────────────────────────┤ │
│ │ Urbano e rural                   │ Sexo                          │ │
│ │ Setores   ████████████░░░▨       │ ██████████▓▓▓▓▓▓▓▓▓▨          │ │
│ │ População ██████████████░▨       │ Mulheres  594.012   52,1%     │ │
│ │ Urbano    2.210  97,8%  ...      │ Homens    545.035   47,8%     │ │
│ │ Rural        98   ...            │ Sem inf.     ...     0,1%     │ │
│ │ Sem class.   37   ...            │                               │ │
│ └──────────────────────────────────┴───────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

Valores ilustrativos.

- A ficha é um único bloco com divisões finas, não cartões separados.
- Os números principais usam a largura expandida; os rótulos ficam acima, em
  texto normal.
- Nas duas barras de urbano e rural, a diferença entre "Setores" e
  "População" é a informação: mostra que poucos setores urbanos concentram a
  maior parte das pessoas.
- Segmentos "Sem classificação" e "Sem informação" em hachura diagonal, com
  legenda escrita.

## Estrutura (celular, < 640px)

Uma coluna: menu recolhido em dois links lado a lado, campo em largura total,
título, e a ficha empilhada (população, setores, área, densidade, urbano e
rural, sexo). A escala de densidade mantém a régua inteira, com rótulos só em
1, 100 e 10.000.

## Estados

| Estado | O que aparece |
|---|---|
| Vazia | Campo com rótulo "Município" e texto de apoio "Digite o nome de um município. Ex.: Campinas, Bom Jesus, Paulo Afonso." Os exemplos são links que preenchem a busca |
| Sugerindo | Lista abaixo do campo com até 10 itens "Nome/SIGLA", o trecho digitado destacado em peso 600 |
| Carregando sugestões | Na lista, uma linha "Buscando municípios" em Tinta diluída, sem animação |
| Falha nas sugestões | Na lista: "Não foi possível carregar os dados." e botão "Tentar de novo"; o texto digitado permanece |
| Sem resultado | Na lista: "Nenhum município encontrado para "xyz". Confira a grafia ou digite só o começo do nome." |
| Carregando | A ficha aparece com as divisões e os rótulos; os valores são substituídos por barras cinza estáticas (sem brilho animado) |
| Erro | Na ficha: "Não foi possível carregar os dados de Campinas/SP." e botão "Tentar de novo" |
| Endereço inválido | Campo vazio com aviso: "Este endereço não corresponde a nenhum município. Busque pelo nome." |

## Texto da interface

| Elemento | Texto |
|---|---|
| Título do menu | Censo 2022 |
| Itens do menu | Busca de cidades · Busca por estado (itens separados, sem ponto no texto) |
| Rótulo do campo | Município |
| Rótulos da ficha | População · Setores censitários · Área · Densidade demográfica · Urbano e rural · Sexo |
| Categorias | Urbano · Rural · Sem classificação · Mulheres · Homens · Sem informação |
| Título da aba | "Campinas/SP - Censo 2022" |
| Rodapé | "Fonte: IBGE, Censo Demográfico 2022" |
| Nota sob "Sexo", quando houver "Sem informação" | "Parte da população não tem informação de sexo na base do Censo." |

## Acessibilidade

- Combobox com padrão ARIA do Reka UI; setas percorrem as sugestões, Enter
  escolhe, Esc fecha.
- Cada barra tem, para leitores de tela, o texto equivalente
  (ex.: "Urbano: 2.210 setores, 94,2%").
- O marcador da escala tem rótulo textual com o valor da densidade.
- Ao carregar os indicadores, o título do município recebe foco programático
  para leitores de tela anunciarem o resultado.
