# Design: tela "Busca por estado"

Segue o [sistema visual](../../.harness/design-system.md) e o padrão de ficha
da [tela da 001](../001-municipality-search/design.md). Plano feito com a
skill `frontend-design` (Princípio IX).

## Ideia

A mesma régua de densidade da tela de município vira o eixo do ranking: cada
linha tem sua mini-régua, e uma linha vertical fina marca a densidade da UF em
todas elas. Rolando a tabela, o visitante vê os pontos se aproximarem da
linha da UF e passarem para o lado menos denso, sem precisar ler número por
número.

## Estrutura (desktop, ≥ 1024px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Censo 2022      Busca de cidades   Busca por estado                  │
├──────────────────────────────────────────────────────────────────────┤
│ Unidade federativa                                                   │
│ ┌──────────────────────────┐                                         │
│ │ Minas Gerais          ▾ │                                         │
│ └──────────────────────────┘                                         │
│                                                                      │
│ Minas Gerais MG                              ← título expandido      │
│                                                                      │
│ ┌──────────────────┬──────────────────┬────────────────────────────┐ │
│ │ População        │ Área             │ Densidade demográfica      │ │
│ │ 20.539.989       │ 586.513,98 km²   │ 35,02 hab/km²              │ │
│ ├──────────────────┴──────────────────┴────────────────────────────┤ │
│ │ 0,1 ──┼──────┼────●─┼──────┼──────┼────── 100.000                │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ Filtrar municípios                                853 municípios     │
│ ┌──────────────────────────┐                                         │
│ │                          │                                         │
│ └──────────────────────────┘                                         │
│                                                                      │
│ Posição  Município          População   Área (km²)  Densidade  Escala│
│ ───────────────────────────────────────────────────────────── (fixo) │
│       1  Belo Horizonte     2.315.560     331,35   6.988,11  ────┼●─ │
│       2  Contagem             621.863     194,75   3.193,17  ───●┼── │
│     ...                                                         │    │
│     853  ...                                                ●   │    │
└──────────────────────────────────────────────────────────────────────┘
```

Valores ilustrativos.

- Números alinhados à direita, largura condensada, algarismos tabulares.
- A coluna "Escala" usa a mesma régua logarítmica da tela de município; a
  linha vertical é a densidade da UF.
- Cabeçalho da tabela fixo ao rolar.
- Filtro acima da tabela, com a contagem "853 municípios" (ou "3 de 853
  municípios" com filtro).
- Quando `areaOutsideMunicipalitiesKm2 > 0` (RS), nota sob a área:
  "Inclui 13.085,86 km² fora dos municípios, registrados sem município na
  base do Censo."

## Estrutura (celular, < 640px)

Seleção de UF e ficha empilhadas; filtro em largura total. A tabela vira uma
lista em que cada item tem duas linhas: posição e nome em cima; embaixo, três
pares rótulo/valor em grade (População, Área, Densidade). A mini-régua fica
sob cada item em largura total.

## Estados

| Estado | O que aparece |
|---|---|
| Sem UF escolhida | Seleção com texto de apoio: "Escolha uma unidade federativa para ver seus municípios ordenados por densidade." |
| Carregando | Ficha com rótulos e tabela com 10 linhas cinza estáticas |
| Erro | "Não foi possível carregar os dados de Minas Gerais (MG)." e botão "Tentar de novo" |
| Filtro sem resultado | "Nenhum município de Minas Gerais corresponde a "xyz"." |
| Endereço inválido | Seleção vazia com aviso: "Este endereço não corresponde a nenhuma unidade federativa. Escolha uma na lista." |

## Texto da interface

| Elemento | Texto |
|---|---|
| Rótulo da seleção | Unidade federativa |
| Opções | Nome e sigla (ex.: "Minas Gerais MG") |
| Rótulo do filtro | Filtrar municípios |
| Colunas | Posição · Município · População · Área (km²) · Densidade (hab/km²) · Escala |

## Acessibilidade

- Seleção de UF com o componente Select do shadcn-vue (Reka UI), com busca
  por digitação.
- Tabela semântica (`<table>`, `<th scope>`); a coluna "Escala" é decorativa
  para leitores de tela (o valor já está na coluna Densidade).
- A contagem de resultados do filtro é anunciada a leitores de tela.
- Ao carregar o ranking, o título da UF recebe foco programático.
