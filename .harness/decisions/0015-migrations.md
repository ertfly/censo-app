# 0015. Migrations com o Migrator do Kysely

- Status: Aceito
- Data: 2026-09-25
- Complementa: [ADR 0006](0006-acesso-a-dados.md)

## Contexto

O ADR 0006 definiu o `Migrator` do Kysely como ferramenta de migrations, sem
detalhar o uso. Restrições que afetam o uso:

- O banco `data/censo.sqlite` foi recebido pronto, sem histórico de
  migrations ([ADR 0001](0001-banco-de-dados-sqlite.md)).
- Em produção o banco é somente leitura, montado com `:ro`
  ([ADR 0007](0007-primeira-versao-somente-leitura.md)).
- Os testes de integração usam SQLite em memória com o mesmo schema de
  produção ([ADR 0009](0009-testes.md)).
- Arquivo `.sqlite` é binário e não tem diff legível.

## Decisão

### Arquivos

- Local: `backend/src/infra/database/migrations/`.
- Nome: `NNNN-descricao-em-kebab-case.ts` (ex.: `0001-baseline.ts`). O
  `Migrator` executa em ordem alfabética; a numeração garante a ordem.
- Cada arquivo exporta `up` e `down`.

### Migration de base

- `0001-baseline.ts` cria as tabelas `uf`, `municipio`, `setor` e
  `demografia` exatamente como estão no banco entregue, com `IF NOT EXISTS`.
- No banco real, as tabelas já existem: a migration não altera nada e fica
  registrada como executada.
- No banco de teste em memória, cria o schema do zero.
- O `down` da base lança erro: desfazê-la apagaria os dados do censo.

### `down`

- Obrigatório quando a mudança pode ser desfeita sem perda de dados (ex.:
  índices).
- Quando não puder, lança erro explicando o motivo. No SQLite, várias
  alterações de tabela exigem recriar a tabela.

### Execução

| Ambiente | Roda? | Como |
|---|---|---|
| Desenvolvimento | Sim, por comando | `npm run migrate` (e `npm run migrate:down`) no container do backend de `compose.dev.yaml`; altera `data/censo.sqlite`, que é commitado de forma deliberada |
| Testes | Sim, automaticamente | Cada suíte cria SQLite em memória e aplica todas as migrations |
| Produção | Não | O banco chega migrado pelo git e é montado somente leitura |

- Os comandos usam um script próprio com o `Migrator`; o `kysely-ctl` não é
  usado (versão 0.x e dispensável).
- Na inicialização em produção, o backend verifica se todas as migrations
  existentes no código estão aplicadas no banco. Se faltar alguma, não sobe e
  informa quais estão pendentes.

### Controle

- O `Migrator` registra o histórico nas tabelas `kysely_migration` e
  `kysely_migration_lock`, dentro de `censo.sqlite`.
- `PRAGMA user_version` não é usado para versionar o schema.
- Cada migration aplicada ao banco versionado é commitada junto com o arquivo
  da migration.

## Alternativas consideradas

- **SQL puro com `PRAGMA user_version`:** nativo do SQLite, mas o controle de
  execução seria código próprio a manter.
- **dbmate:** binário externo adicional na imagem Docker, fora do ecossistema
  TypeScript.
- **kysely-ctl:** em versão 0.x; um script curto cobre o necessário.
- **drizzle-kit, Prisma Migrate:** dependem dos ORMs descartados no ADR 0006.
- **Rodar migrations na inicialização em produção:** impossível com o banco
  somente leitura, e alteraria o arquivo versionado.

## Consequências

- Toda mudança de schema tem histórico legível no git.
- Banco real, banco de teste e banco de outra máquina chegam ao mesmo schema.
- O banco versionado passa a conter as tabelas de controle do Kysely.
- Código novo não roda contra banco desatualizado em produção.
