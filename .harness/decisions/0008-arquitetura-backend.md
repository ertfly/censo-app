# 0008. Arquitetura do backend: DDD simplificado com CQRS de leitura

- Status: Aceito
- Data: 2026-09-25

## Contexto

O backend é Node.js + TypeScript com Fastify ([ADR 0002](0002-runtime-e-backend.md))
e acesso a dados via Kysely ([ADR 0006](0006-acesso-a-dados.md)). A primeira
versão é somente leitura, com escrita em aberto
([ADR 0007](0007-primeira-versao-somente-leitura.md)).

O objetivo é um DDD simples e direto: separar domain, application e infra,
usando DTO, UseCase, CQRS (apenas Query nesta versão), Repository e Value
Object. A referência de quem define a arquitetura é a prática em PHP; este ADR
registra as diferenças estruturais em Node.js/TypeScript.

## Decisão

### Camadas

```
backend/src/
├── domain/
│   ├── value-objects/     # StateCode, MunicipalityCode, CensusTractCode, AreaType...
│   ├── errors/            # erros de domínio (classes que estendem Error)
│   ├── entities/          # reservado para a escrita (não criado na v1)
│   └── repositories/      # reservado para a escrita (não criado na v1)
├── application/
│   ├── queries/           # uma pasta por Query
│   │   └── <query-name>/
│   │       ├── <name>.query.ts     # DTO de entrada (schema TypeBox + tipo)
│   │       ├── <name>.result.ts    # DTO de saída (schema TypeBox + tipo)
│   │       ├── <name>.reader.ts    # interface (porta) de leitura
│   │       └── <name>.handler.ts   # QueryHandler
│   └── use-cases/         # reservado para Commands (não criado na v1)
├── infra/
│   ├── database/          # conexão, tipos das tabelas, migrations, readers Kysely
│   └── http/              # rotas Fastify, error handler
└── main.ts                # composition root
```

Pastas reservadas só são criadas quando a escrita for adotada.

### Regra de dependência

- `domain` não importa nada de fora dele: nem framework, nem banco, nem
  `application`.
- `application` importa apenas `domain`.
- `infra` importa `domain` e `application`.
- `main.ts` importa tudo e liga as peças.

A regra é verificada por lint na montagem do projeto.

### Papel de cada padrão na v1

| Padrão | Uso na v1 |
|---|---|
| Value Object | Validação e significado dos códigos e valores do domínio |
| DTO | Entrada e saída das Queries e das rotas; schema TypeBox que gera o tipo e a validação |
| Query (CQRS) | Cada consulta da aplicação é uma Query com seu Handler; é o caso de uso de leitura |
| UseCase | Na v1, o papel é cumprido pelos QueryHandlers. `use-cases/` fica para Commands |
| Repository | Não usado na v1: a leitura CQRS não passa por entidades. Volta com a escrita |

### Fluxo de uma consulta

```
rota Fastify (infra/http)
  → valida a entrada com o schema TypeBox do DTO
  → QueryHandler (application)
      → converte a entrada em Value Objects (domain)
      → chama a porta de leitura (interface em application)
  → Reader Kysely (infra/database) implementa a porta e devolve o DTO de saída
  → rota responde com o DTO (validado pelo schema de saída)
```

### Diferenças em relação ao PHP

1. **Sem container de injeção automática.** Tipos e interfaces não existem em
   tempo de execução. As dependências são ligadas manualmente, com `new`, no
   `main.ts` (composition root). Sem decorators nem `reflect-metadata`.
2. **Processo único e longo.** Handlers e readers são instanciados uma vez e
   atendem todas as requisições. Nenhum deles guarda estado de requisição em
   propriedades. A conexão com o banco é aberta uma única vez.
3. **DTO é tipo derivado de schema.** Validação em tempo de execução acontece
   na borda (rotas), com TypeBox 1.3.34 e `@fastify/type-provider-typebox`
   6.1.0.
4. **Value Object por convenção:** construtor privado, fábrica estática
   `create()` que valida e lança erro de domínio, `equals()` explícito e
   `Object.freeze(this)`.
5. **Interfaces estruturais:** implementações usam `implements` para deixar a
   intenção explícita.
6. **Portas assíncronas:** interfaces retornam `Promise`, independentemente do
   driver ser síncrono.
7. **Erros:** classes de erro de domínio; um único error handler no Fastify
   traduz cada erro para o status HTTP. Em `catch`, o erro é `unknown`.
8. **Imports:** subpath imports nativos do Node (`#domain/*`,
   `#application/*`, `#infra/*` no `package.json`), sem caminhos relativos
   longos.
9. **Sem `enum` do TypeScript:** usar union types ou objetos `as const`.

## Alternativas consideradas

- **Container de DI (tsyringe, inversify):** exige decorators e
  `reflect-metadata`; complexidade sem ganho para o tamanho do projeto.
- **Módulos por contexto (`modules/<contexto>/{domain,application,infra}`):**
  útil com vários contextos; o projeto tem um único contexto (censo) com
  quatro tabelas.
- **Query passando por Repository e entidades:** adiciona camadas sem função
  em uma aplicação somente leitura.

## Consequências

- Domínio e aplicação testáveis sem banco e sem framework.
- A adoção de escrita adiciona `entities/`, `repositories/` e `use-cases/` sem
  alterar a estrutura existente.
- Todo o código em inglês; tabelas e colunas em português ficam restritas a
  `infra/database`. Glossário e nomenclatura em
  [conventions.md](../conventions.md).
