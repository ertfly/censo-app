# 0001. Banco de dados SQLite em data/ versionado com Git LFS

- Status: Aceito (modo de uso revisto pelo [ADR 0007](0007-primeira-versao-somente-leitura.md))
- Data: 2026-09-25

## Contexto

O projeto já possui um banco SQLite (`censo.sqlite`, ~35 MB) recebido pronto,
sem processo de geração conhecido. Ele contém dados agregados do censo, sem
dados pessoais identificáveis:

| Tabela | Linhas | Conteúdo |
|---|---|---|
| `uf` | 27 | Unidades da federação |
| `municipio` | 5.571 | Municípios |
| `setor` | 468.099 | Setores censitários (situação, área, população) |
| `demografia` | 458.772 | Moradores, homens e mulheres por setor |

O arquivo estava na raiz do repositório. A aplicação fará leitura e escrita
nesse banco. O banco não tem senha e não terá acesso externo: é acessado
apenas localmente pela própria aplicação.

## Decisão

- O banco fica em `data/censo.sqlite`, pasta neutra em relação à stack, que
  ainda não foi definida.
- O arquivo é versionado com Git LFS (`*.sqlite` no `.gitattributes`).
- O banco permanece sem senha e sem exposição externa.

## Alternativas consideradas

- **Manter na raiz:** mistura dados com arquivos de configuração do projeto.
- **Pasta específica de framework (`db/`, `database/`):** antecipa uma escolha
  de stack ainda não feita.
- **Fora do git (`.gitignore`):** sem processo de geração conhecido, o arquivo
  não poderia ser reconstruído por quem clonar o repositório.
- **Commit direto no git:** cada alteração somaria ~35 MB ao histórico de forma
  permanente.

## Consequências

- Quem clonar o repositório precisa ter o Git LFS instalado.
- Como a aplicação grava no banco, o arquivo versionado muda durante o uso.
  Cada commit do arquivo guarda uma cópia inteira no LFS; commitar o banco deve
  ser uma ação deliberada, não um efeito colateral do uso.
- Arquivo binário não tem diff legível. Mudanças de estrutura devem ser
  rastreáveis em texto (migrations ou schema versionado), a definir junto com a
  stack.
- Sem senha e sem acesso externo, a proteção do banco depende do controle de
  acesso à máquina/ambiente onde a aplicação roda.
