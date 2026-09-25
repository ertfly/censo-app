# Sistema visual

> Definido com a skill `frontend-design` ([ADR 0004](decisions/0004-ui-tailwind-shadcn-vue.md),
> Princípio IX da constituição). Vale para as duas telas. O layout de cada tela
> fica no `design.md` da feature (`specs/NNN-*/design.md`).

## Assunto

Dados do Censo Demográfico 2022 (IBGE), agregados por setor censitário. O
visitante é qualquer pessoa que quer conhecer um município ou comparar os
municípios de um estado. O trabalho da interface é tornar números grandes e
proporções legíveis de imediato, sem conhecimento técnico.

Referências do próprio assunto, de onde saem as escolhas:

- **O questionário do recenseador**: campos em caixas, rótulo pequeno e
  resposta grande, organização em grade.
- **O mapa temático**: cores convencionadas para urbano e rural e hachura para
  área sem dado.
- **A escala gráfica do mapa**: régua com marcações, usada aqui para densidade.

## Cor

| Nome | Hex | Uso |
|---|---|---|
| Papel cadastral | `#EEF2EE` | Fundo da página |
| Folha | `#FAFBF9` | Fundo da ficha e dos campos |
| Tinta azulada | `#12313A` | Texto principal, divisões da ficha (com opacidade), segmento "Mulheres" |
| Tinta diluída | `#4A747D` | Texto secundário, segmento "Homens" |
| Ciano de marcação | `#0B7285` | Único destaque: foco, item ativo do menu, links, marcador da escala |
| Ocre urbano | `#B7791F` | Segmento "Urbano" |
| Verde de cobertura | `#3F7D4E` | Segmento "Rural" |
| Hachura sem dado | `#7B8884` | Linhas diagonais sobre Folha: "Sem classificação" e "Sem informação" |

- Texto sempre em Tinta azulada ou Tinta diluída, nunca nas cores de
  categoria; categorias usam cor só em barras e marcadores, sempre com rótulo
  escrito ao lado (a cor nunca é a única pista).
- Contraste mínimo AA para todo texto e 3:1 para elementos gráficos. Conferido na implementação (T036 da 001): Tinta azulada 12,17; Tinta diluída 4,55; Ciano 4,94 (texto, sobre Papel); Ocre 3,22; Verde 4,36; Hachura 3,26 (gráficos, sobre Papel). A Tinta diluída (antes #5E8A93, 3,36) e a Hachura (antes #9AA7A3, 2,20) foram escurecidas por não atingirem o mínimo.
- Fonte: Archivo via `@fontsource-variable/archivo` (`standard.css`, eixos de peso e largura 62%–125%); o eixo de largura foi confirmado.
- Modo escuro fora da v1.

## Tipografia

Uma família: **Archivo** (variável, eixos de peso e largura), com a largura
codificando o papel do texto.

| Papel | Largura | Peso | Tamanho |
|---|---|---|---|
| Nome do município ou da UF (título da tela) | 125 (expandida) | 700 | 2,5–3,5rem, fluido |
| Números principais da ficha | 125 (expandida) | 600 | 2rem |
| Texto corrido, rótulos, menu | 100 | 400 / 500 | 1rem / 0,875rem |
| Tabela do ranking e legendas numéricas | 85 (condensada) | 400 | 0,9375rem |

- Algarismos tabulares (`font-variant-numeric: tabular-nums`) em todo número,
  para alinhar colunas.
- Unidades (km², hab/km², %) em peso 400 e largura 85, menores que o número.
- Rótulos em caixa normal (sentence case); sem caixa alta, sem rótulo acima de
  rótulo.
- Linhas de texto com até 70 caracteres.

## Forma

- Raio de borda de 4px em campos, ficha e menu; sem sombra projetada.
- Divisões da ficha: 1px de Tinta azulada a 15% de opacidade.
- Barras de proporção: altura 12px, sem arredondamento interno entre
  segmentos.
- Escala de densidade: régua logarítmica de 0,1 a 100.000 hab/km², marcações
  em 1, 10, 100, 1.000 e 10.000, rótulos em pt-BR.

## Movimento

- Um único movimento: ao escolher um município (ou ao exibir o ranking), o
  marcador da escala de densidade desliza até a posição. Com
  `prefers-reduced-motion`, aparece direto na posição.
- Nenhuma animação de entrada em seções; nenhum efeito de passagem do mouse
  além da mudança de cor em links e itens de lista.

## Texto da interface

- Voz direta, frases curtas, verbos simples, pt-BR.
- Erros dizem o que aconteceu e o que fazer; não pedem desculpas.
- A mesma ação tem o mesmo nome em toda a interface ("Tentar de novo").
- Números sempre com formato brasileiro (ver [conventions.md](conventions.md)).

## Piso de qualidade

- Responsivo até 360px de largura.
- Foco visível em Ciano de marcação, 2px, em todo elemento interativo.
- Navegação completa por teclado; leitores de tela recebem os valores das
  barras em texto.
- `prefers-reduced-motion` respeitado.
