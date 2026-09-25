# 0012. Comunicação entre consultas e entre contextos

- Status: Aceito
- Data: 2026-09-25
- Complementa: [ADR 0008](0008-arquitetura-backend.md)

## Contexto

Foi proposto usar interfaces com injeção de dependência para que uma parte do
domínio obtenha dados de outra (por exemplo, "puxar uma query de outro
domínio"). Na análise:

- A injeção de dependência por interface já é o mecanismo entre camadas
  (ADR 0008), mas não impede importações diretas que a contornem; por isso as
  fronteiras são verificadas por lint ([ADR 0011](0011-lint-e-formatacao.md)).
- O projeto tem um único contexto (censo). UF, município, setor e demografia
  são partes do mesmo domínio, não domínios distintos.
- Queries pertencem à camada `application`; o domínio não as chama.

## Decisão

1. **Um único contexto.** Não há interfaces entre UF, município, setor e
   demografia. Dados relacionados são obtidos por join no reader da consulta.
2. **Domínio não chama Query.** `domain` recebe dados prontos; quem orquestra é
   `application`.
3. **Query não chama Query.** Cada consulta tem seu próprio reader, que busca
   tudo o que ela precisa em uma ida ao banco. Um QueryHandler não depende de
   outro QueryHandler.
4. **Se surgir um segundo contexto:** a comunicação é feita exclusivamente por
   interface, e a interface é **declarada pelo contexto consumidor** (o que
   ele precisa receber), não pelo fornecedor. A implementação que liga ao
   outro contexto é feita no `main.ts`. O consumidor não importa nada do
   fornecedor (camada anticorrupção).

## Alternativas consideradas

- **Interface entre cada parte do domínio (UF, município, setor):** cerimônia
  de interface, implementação e ligação para cada cruzamento, sem isolamento
  real, já que é o mesmo banco e o mesmo contexto.
- **Handlers reutilizando outros handlers:** reaproveita código, mas acopla
  consultas entre si e tende a gerar N+1 consultas ao banco.
- **Interface declarada pelo fornecedor:** o consumidor passaria a depender do
  modelo do fornecedor, anulando o isolamento.

## Consequências

- Consultas independentes entre si; alterar uma não afeta outra.
- Pode haver SQL parecido em readers diferentes; a repetição é aceita em troca
  da independência. Trechos comuns podem virar funções auxiliares dentro de
  `infra/database`.
- A criação de um segundo contexto exige novo ADR definindo seus limites.
