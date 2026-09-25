# 0006. Acesso a dados com better-sqlite3 e Kysely

- Status: Aceito (complementado pelo [ADR 0015](0015-migrations.md))
- Data: 2026-09-25

## Contexto

O backend em Node.js e TypeScript ([ADR 0002](0002-runtime-e-backend.md))
acessa o SQLite de `data/censo.sqlite` ([ADR 0001](0001-banco-de-dados-sqlite.md)).
A arquitetura separa domínio, aplicação e infra, com Queries (CQRS) e
Repositories. A camada de acesso não deve impor um modelo de entidades ao
domínio. O projeto usa somente versões estáveis.

## Decisão

| Item | Escolha | Versão |
|---|---|---|
| Driver | better-sqlite3 | 13.0.3 |
| Query builder | Kysely (com `SqliteDialect`) | 0.29.6 |
| Migrations | `Migrator` do Kysely, arquivos em TypeScript | 0.29.6 |

- Kysely e better-sqlite3 ficam restritos à camada `infra`.
- Versões fixadas exatamente (sem `^` ou `~`), porque o Kysely ainda está na
  série 0.x.
- Toda conexão aplica `PRAGMA foreign_keys = ON`.
- Mudanças de schema (incluindo índices, ver [indexes.md](../indexes.md)) são
  feitas somente via migration.
- Os tipos das tabelas para o Kysely são escritos a partir do mapeamento em
  [database.md](../database.md).

## Alternativas consideradas

- **`node:sqlite` (embutido no Node):** no Node 24 está com estabilidade 1.2
  (release candidate). Fere a regra de versões estáveis.
- **Prisma:** a tag `latest` do npm aponta para uma versão release candidate;
  além disso, seu modelo gerado tende a substituir as entidades do domínio.
- **Drizzle ORM:** viável, mas o schema do ORM tende a virar a entidade,
  misturando infra e domínio.
- **SQL puro com better-sqlite3:** sem tipagem das consultas nem sistema de
  migrations.

## Consequências

- Consultas tipadas pelo TypeScript, com SQL previsível para as Queries.
- better-sqlite3 é dependência nativa: a imagem `node:24.21.0-slim` (Debian,
  glibc) usa binários pré-compilados, sem necessidade de compilar
  ([ADR 0005](0005-docker-compose.md)).
- better-sqlite3 é síncrono, mas a API do Kysely é assíncrona; as portas do
  domínio retornam `Promise` e não dependem do driver.
- O banco atual não tem histórico de migrations. A primeira migration parte do
  schema existente como base e ajusta `user_version`.
- Atualizações do Kysely devem ser revisadas manualmente enquanto estiver em
  0.x.
