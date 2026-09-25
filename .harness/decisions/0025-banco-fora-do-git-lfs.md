# 0025. Banco versionado sem Git LFS

- Status: Aceito
- Data: 2026-09-25
- Revisa: [ADR 0018](0018-banco-na-raiz.md) (forma de versionar o banco)

## Contexto

O ADR 0018 manteve o `censo.sqlite` na raiz, versionado com Git LFS. O
requisito de entrega é clonar o repositório e rodar um único comando numa
máquina que só tem Docker. Sem o Git LFS instalado, o `git clone` baixa um
ponteiro de texto no lugar do banco; o backend detecta o ponteiro e não sobe,
e a aplicação fica inutilizável sem um passo manual (`git lfs pull`).

O arquivo tem 35 MB, abaixo do limite de 100 MB por arquivo do GitHub.

## Decisão

- O `censo.sqlite` passa a ser versionado diretamente no Git, sem Git LFS.
- O `.gitattributes` deixa de enviar `*.sqlite` para o LFS e marca o banco
  como binário.
- A verificação do arquivo na subida do backend continua detectando o
  ponteiro do LFS, para quem ainda tiver um clone antigo.

## Alternativas consideradas

- **Manter o Git LFS e documentar a instalação:** repositório mais leve, mas
  quem clonar sem o LFS não consegue usar a aplicação, o que descumpre o
  requisito.
- **Baixar o banco no build ou na subida do container:** depende de uma URL
  externa e de rede no momento da subida.

## Consequências

- `git clone` traz o banco pronto para uso.
- O clone fica 35 MB maior, e cada nova versão do banco soma o tamanho
  inteiro ao histórico. Se o banco passar a mudar com frequência ou crescer
  perto de 100 MB, a decisão deve ser revista.
- Os commits anteriores continuam com o ponteiro do LFS; o histórico não é
  reescrito.
