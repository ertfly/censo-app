# .harness

Arquitetura e decisões técnicas do censo-app.

Este diretório é a fonte das decisões técnicas do projeto. A constituição do
spec-kit (`.specify/memory/constitution.md`) e o `plan.md` de cada feature
(`specs/NNN-*/`) devem seguir o que está definido aqui.

## Conteúdo

| Arquivo | Propósito |
|---|---|
| [architecture.md](architecture.md) | Visão geral da arquitetura: componentes, camadas, fluxos |
| [stack.md](stack.md) | Tecnologias escolhidas e justificativas |
| [conventions.md](conventions.md) | Padrões de código, nomenclatura e organização |
| [database.md](database.md) | Mapeamento do banco: estrutura, qualidade dos dados, melhorias |
| [indexes.md](indexes.md) | Diagnóstico de índices e processo para criá-los |
| [decisions/](decisions/) | Registros de decisão de arquitetura (ADRs) |

## Processo

1. Toda decisão técnica relevante vira um ADR em `decisions/`.
2. Após aceita, a decisão é refletida em `architecture.md`, `stack.md` ou
   `conventions.md`.
3. Uma decisão substituída não é apagada: o ADR antigo recebe o status
   `Substituído por NNNN` e um novo ADR é criado.
