# Constituição do censo-app

## Princípios fundamentais

Esta constituição define princípios. O detalhe técnico de cada um está no
`.harness/` e é referenciado, não duplicado. Se o texto desta constituição
divergir de um ADR em detalhe técnico, vale o ADR, e a constituição é
corrigida.

### I. Documentação antes do código (INEGOCIÁVEL)

- Nenhuma implementação começa sem `spec.md`, `plan.md` e `tasks.md` da feature
  aprovados.
- A documentação de todas as features planejadas é concluída antes do início
  da implementação.
- Specs são criadas a partir de histórias de usuário e descrevem o quê e o
  porquê, sem detalhes técnicos.
- Toda decisão técnica relevante é registrada como ADR em
  `.harness/decisions/` antes de ser aplicada. ADRs não são apagados: são
  substituídos, revistos ou complementados por novos ADRs.

Motivo: decisões tomadas no código se perdem; decisões documentadas podem ser
revistas.

### II. Somente leitura na primeira versão

- A v1 apenas consulta dados. Nenhuma feature grava no banco
  ([ADR 0007](../../.harness/decisions/0007-primeira-versao-somente-leitura.md)).
- O banco é aberto em modo leitura e montado como somente leitura em produção.
- Qualquer escrita exige um novo ADR, originado de uma história de usuário.

Motivo: o requisito principal é consulta; escrita traz Commands, entidades e
Repositories que só se justificam com uma necessidade real.

### III. Arquitetura e fronteiras verificadas

- Backend: DDD simplificado com CQRS de leitura, camadas `domain`,
  `application` e `infra`
  ([ADR 0008](../../.harness/decisions/0008-arquitetura-backend.md),
  [ADR 0012](../../.harness/decisions/0012-comunicacao-entre-consultas-e-contextos.md)).
- Frontend: Feature-Sliced Design enxuto
  ([ADR 0014](../../.harness/decisions/0014-arquitetura-frontend.md)).
- As fronteiras de importação são verificadas por lint e uma violação quebra
  o lint ([ADR 0011](../../.harness/decisions/0011-lint-e-formatacao.md)).
- Código não sobe de camada no frontend nem ganha abstração no backend sem
  necessidade concreta (reuso real ou nova decisão).

Motivo: regra que depende só de disciplina é quebrada; regra verificada por
ferramenta, não.

### IV. Contrato único entre backend e frontend

- Toda rota da API tem seus schemas de entrada e saída em `@censo/contracts`
  ([ADR 0013](../../.harness/decisions/0013-organizacao-do-repositorio.md)).
- O pacote de contratos contém apenas schemas; nenhuma regra de negócio.
- Mudança de contrato deve quebrar a compilação das duas pontas, nunca a
  aplicação em produção.

Motivo: tipos duplicados à mão divergem.

### V. Testes obrigatórios por camada

- Cada camada tem o tipo de teste definido no
  [ADR 0009](../../.harness/decisions/0009-testes.md): unitário para Value
  Objects, QueryHandlers e lógica do frontend; integração para readers e
  rotas; E2E para os fluxos das histórias de usuário.
- Nenhum teste usa `data/censo.sqlite`.
- Cada feature do spec-kit entrega seus testes junto com o código; uma tarefa
  de implementação não está concluída sem eles.

Motivo: teste unitário com dependência simulada não verifica a infra; cada
camada precisa do seu nível de teste.

### VI. Idioma

- Código, nomes de arquivos, rotas da API e URLs das páginas: inglês.
- Tudo que é visual para o usuário (exceto URLs): pt-BR.
- Nomes de tabelas e colunas em português ficam restritos a
  `backend/src/infra/database`.
- Documentação, ADRs, specs e commits: português.
- Termos do domínio seguem o glossário de
  [conventions.md](../../.harness/conventions.md).

Motivo: o banco foi entregue em português; o restante do código segue um
idioma único.

### VII. Versões estáveis e fixadas

- Somente versões estáveis: tag `latest` do npm, Node.js LTS, imagens Docker
  em linha estável. Nada de beta, rc, next ou linha Current.
- Versões fixadas exatamente, sem `^` ou `~`, e registradas em
  [stack.md](../../.harness/stack.md).
- Troca de versão principal de qualquer peça da stack passa por ADR.

Motivo: builds reproduzíveis e sem quebra por atualização implícita.

### VIII. Execução só com Docker, em um comando

- A aplicação completa sobe com `docker compose up` (produção) ou
  `docker compose -f compose.dev.yaml up` (desenvolvimento), numa máquina que
  tenha apenas Docker ([ADR 0005](../../.harness/decisions/0005-docker-compose.md)).
- Testes, lint e migrations também rodam em container.
- Nenhuma instrução de uso pode exigir Node.js ou outra ferramenta no host,
  exceto Git com Git LFS para obter o repositório.

Motivo: requisito de distribuição do projeto.

### IX. Design de frontend intencional

- Todo trabalho de frontend (telas, componentes, layout, estilo) é feito com a
  skill `frontend-design`
  ([ADR 0004](../../.harness/decisions/0004-ui-tailwind-shadcn-vue.md)).
- A identidade visual vem do plano de design da skill, aplicada via tema do
  Tailwind; nenhuma biblioteca dita a aparência.
- Requisitos mínimos: responsivo até mobile, foco visível por teclado,
  movimento reduzido respeitado, contraste acessível.

Motivo: evitar interface com aparência de template.

## Restrições técnicas

- Stack completa e versões: [stack.md](../../.harness/stack.md).
- Arquitetura consolidada: [architecture.md](../../.harness/architecture.md).
- Banco: SQLite em `data/censo.sqlite`, versionado com Git LFS, sem senha e
  sem acesso externo; só o nginx publica porta no host.
- Mudanças de schema só via migration, aplicadas em desenvolvimento e
  commitadas de forma deliberada; nunca executadas em produção
  ([ADR 0015](../../.harness/decisions/0015-migrations.md)).
- Índices são definidos no `plan.md` da feature que precisa deles e criados
  via migration, seguindo [indexes.md](../../.harness/indexes.md).

## Fluxo de desenvolvimento

- Sequência por feature do spec-kit: `/speckit-specify` → `/speckit-clarify`
  → `/speckit-plan` → `/speckit-checklist` → `/speckit-tasks` →
  `/speckit-analyze`; a implementação (`/speckit-implement` ⇄
  `/speckit-converge`) só começa após a documentação de todas as features
  planejadas (Princípio I).
- O `plan.md` de cada feature verifica conformidade com esta constituição e
  com os ADRs; qualquer desvio exige ADR antes de seguir.
- Commits:
  - Conventional Commits com prefixo padrão e sem escopo
    (`feat: ...`, nunca `feat(modulo): ...`).
  - Mensagem de uma linha, com no máximo 72 caracteres.
  - Um commit por passo concluído, pequeno e frequente.
  - Direto na `main`, sem branches, enquanto não houver nova definição.
  - Sem squash e sem reescrita de histórico sem autorização explícita.

## Governança

- Esta constituição prevalece sobre práticas informais. Em detalhe técnico,
  prevalece o ADR referenciado (ver Princípios fundamentais).
- Emendas: propostas por escrito, aprovadas pelo responsável do projeto e
  commitadas como `docs: ...`, com a versão atualizada.
- Versionamento semântico da constituição:
  - MAJOR: remoção ou redefinição incompatível de princípio.
  - MINOR: novo princípio ou seção, ou ampliação material de orientação.
  - PATCH: esclarecimento, redação ou correção sem mudança de sentido.
- Conformidade: todo `plan.md` contém a verificação de conformidade; todo
  `/speckit-analyze` aponta violações; violações não justificadas por ADR
  bloqueiam a implementação.

**Version**: 1.0.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-09-25
