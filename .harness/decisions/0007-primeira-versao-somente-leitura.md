# 0007. Primeira versão somente leitura, escrita em aberto

- Status: Aceito (montagem do banco revista pelo [ADR 0018](0018-banco-na-raiz.md))
- Data: 2026-09-25
- Revisa: [ADR 0001](0001-banco-de-dados-sqlite.md) (modo de uso) e
  [ADR 0005](0005-docker-compose.md) (montagem do banco)

## Contexto

O ADR 0001 registrou que a aplicação faria leitura e escrita no banco. A
definição foi refinada: a primeira versão apenas consulta os dados. A escrita
pode ser necessária no futuro, mas essa decisão só será tomada depois de
cumprido o requisito principal.

## Decisão

- **Primeira versão: somente leitura.** Nenhuma funcionalidade grava no banco.
- **Conexão em modo leitura:** o backend abre o banco com `readonly: true` no
  better-sqlite3.
- **Volume somente leitura em produção:** `data/` é montado com `:ro` no
  container do backend.
- **Mudanças de schema** (migrations, índices) são aplicadas no ambiente de
  desenvolvimento, sobre `data/censo.sqlite`, e o arquivo resultante é
  commitado de forma deliberada.
- **Escrita em aberto:** se for necessária, será definida em um novo ADR,
  a partir de uma história de usuário. A arquitetura
  ([ADR 0008](0008-arquitetura-backend.md)) já reserva o caminho de escrita.

## Alternativas consideradas

- **Manter leitura e escrita desde já:** traria Commands, entidades e
  Repositories sem nenhuma funcionalidade que os use.
- **Somente leitura sem `:ro` no volume:** depende apenas do código para não
  gravar; um erro alteraria o arquivo versionado no LFS.

## Consequências

- O arquivo versionado não muda com o uso da aplicação; o atrito com o Git LFS
  descrito no ADR 0001 deixa de existir na primeira versão.
- O modo WAL (proposto em [database.md](../database.md)) não se aplica: não há
  escrita concorrente, e WAL exige gravação de arquivos auxiliares.
- Migrations não rodam na inicialização em produção; rodam por comando no
  ambiente de desenvolvimento.
- Se a escrita for adotada, este ADR é substituído e os ADRs 0001 e 0005 voltam
  a valer como escritos.
