# 0010. TypeScript 6.0.3 no lugar do TypeScript 7

- Status: Aceito
- Data: 2026-09-25
- Revisa: [ADR 0002](0002-runtime-e-backend.md) (versão do TypeScript)

## Contexto

O ADR 0002 adotou o TypeScript 7.0.2 e previu: se a compatibilidade com o
ferramental falhar, adota-se a última versão 6.x estável.

Ao definir o lint ([ADR 0011](0011-lint-e-formatacao.md)), verificou-se que a
versão estável do `typescript-eslint` (8.70.1), necessária para lint com
informação de tipos, declara suporte a `typescript >=4.8.4 <6.1.0`. O
TypeScript 7 fica fora do intervalo suportado.

## Decisão

- O projeto usa **TypeScript 6.0.3**, última versão estável da série 6.0.
- Versão fixada exatamente.
- Retorno ao TypeScript 7 quando uma versão estável do `typescript-eslint`
  declarar suporte a ele, registrado em novo ADR.

## Alternativas consideradas

- **Manter TypeScript 7 sem lint com tipos:** perde as regras de lint que
  dependem de tipos e a verificação confiável de fronteiras de importação.
- **Usar versão não estável do `typescript-eslint`:** fere a regra de versões
  estáveis.

## Consequências

- Todo o ferramental (vue-tsc, typescript-eslint, Vitest) fica em intervalo de
  compatibilidade declarado.
- Perde-se o ganho de desempenho de compilação do TypeScript 7, irrelevante
  para o tamanho do projeto.
