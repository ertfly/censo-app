# 0018. Banco de dados na raiz do repositório

- Status: Aceito
- Data: 2026-09-25
- Substitui: a localização definida no [ADR 0001](0001-banco-de-dados-sqlite.md)
- Revisa: [ADR 0005](0005-docker-compose.md) e
  [ADR 0007](0007-primeira-versao-somente-leitura.md) (montagem do banco) e
  [ADR 0013](0013-organizacao-do-repositorio.md) (`.dockerignore`)

## Contexto

O ADR 0001 moveu o banco para `data/censo.sqlite`. O requisito do projeto
exige que o arquivo `censo.sqlite` fique na raiz do repositório.

## Decisão

- O banco fica em `censo.sqlite`, na raiz do repositório.
- Continua versionado com Git LFS (`*.sqlite` no `.gitattributes`).
- O backend recebe o caminho do banco por variável de ambiente
  (`DATABASE_PATH`); o código não fixa o local do arquivo.

### Montagem nos containers

| Modo | Montagem |
|---|---|
| Produção (`compose.yaml`) | Arquivo único: `./censo.sqlite` montado como somente leitura (`:ro`) no container do backend |
| Desenvolvimento (`compose.dev.yaml`) | A raiz do repositório já é montada ([ADR 0013](0013-organizacao-do-repositorio.md)); o banco é acessado nela, com escrita permitida para migrations |

### Build

- `.dockerignore` exclui `censo.sqlite` (e `*.sqlite`): o banco nunca entra no
  contexto de build nem nas imagens.

## Alternativas consideradas

- **Manter em `data/`:** descumpre o requisito.
- **Link simbólico na raiz apontando para `data/`:** cumpre só na aparência,
  depende do suporte a links no sistema de quem clona e complica a montagem
  nos containers.

## Consequências

- A pasta `data/` deixa de existir.
- Montar um arquivo único (e não uma pasta) prende o container ao arquivo
  original: se o arquivo for substituído no host (por exemplo, `git pull` com
  banco novo), o backend de produção precisa ser reiniciado para enxergar a
  nova versão.
- A regra "nenhum teste usa o banco versionado" continua valendo, agora para
  `censo.sqlite` na raiz.
- Documentos que citam `data/censo.sqlite` são atualizados; ADRs antigos
  recebem a marcação de revisão, sem reescrita do conteúdo.
