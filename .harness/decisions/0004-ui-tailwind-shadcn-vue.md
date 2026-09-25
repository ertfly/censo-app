# 0004. UI com Tailwind CSS, shadcn-vue e Reka UI

- Status: Aceito
- Data: 2026-09-25

## Contexto

Todo trabalho de frontend do projeto usa a skill `frontend-design`. Ela exige
identidade visual própria para o assunto (paleta, tipografia e layout
definidos para o projeto) e evita aparência de template. A camada de UI
precisa, portanto, entregar comportamento e acessibilidade sem impor um
visual.

## Decisão

| Item | Escolha | Versão |
|---|---|---|
| Estilo | Tailwind CSS (com `@tailwindcss/vite`) | 4.3.3 |
| Componentes | shadcn-vue | 2.8.2 |
| Primitivas acessíveis | Reka UI | 2.10.5 |

- Os componentes do shadcn-vue são copiados para o repositório e editados
  livremente; não são uma dependência fechada.
- Paleta, tipografia e espaçamentos ficam em variáveis de tema do Tailwind,
  definidas a partir do plano de design da skill `frontend-design`.
- A skill `frontend-design` é usada antes de qualquer ação de frontend.

## Alternativas consideradas

- **PrimeVue (modo sem estilo):** viável, mas customização extensa tende a
  conflitar com o tema da biblioteca.
- **Vuetify ou Quasar:** impõem Material Design, o visual padronizado que a
  skill `frontend-design` manda evitar.

## Consequências

- Controle total do visual; nenhuma biblioteca dita a aparência.
- Acessibilidade (teclado, foco, ARIA) vem do Reka UI.
- Componentes copiados são código do projeto: atualizações do shadcn-vue não
  chegam automaticamente e são aplicadas manualmente quando necessário.
