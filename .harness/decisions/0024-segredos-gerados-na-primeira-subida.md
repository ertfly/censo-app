# 0024. Segredos gerados na primeira subida

- Status: Aceito
- Data: 2026-09-25
- Revisa: [ADR 0017](0017-protecao-contra-bots.md) e o research R7 da
  [feature 003](../../specs/003-bot-protection/research.md) (origem dos segredos)

## Contexto

A proteção contra bots usa três segredos: `ALTCHA_HMAC_KEY`,
`SESSION_SECRET` e `PROTECTION_LOG_KEY`. Pelo research R7 da 003, eles vinham
só de variáveis de ambiente, e o backend não subia sem eles. Na prática, isso
obrigava a criar o `.env` e gerar três valores antes do primeiro
`docker compose up`.

O requisito de entrega é clonar o repositório, rodar um único comando numa
máquina que só tem Docker e usar a aplicação, sem nenhum passo manual.

## Decisão

- Cada segredo vem da variável de ambiente, quando definida. Sem a variável,
  o backend usa o valor guardado em `/var/lib/censo/secrets/<NOME>`; se o
  arquivo não existir, gera 32 bytes aleatórios (64 caracteres hexadecimais)
  com `crypto.randomBytes` e grava o arquivo com permissão `0600`.
- Os arquivos ficam no volume Docker `secrets`: os valores continuam os mesmos
  entre reinícios, e as sessões abertas e o identificador embaralhado dos
  registros de proteção ([ADR 0019](0019-registros-de-protecao.md)) não mudam.
- As regras de validação continuam: pelo menos 32 caracteres e os três
  diferentes entre si. Um valor inválido vindo da variável ainda impede a
  subida.
- O `.env` passa a ser opcional: serve só para sobrescrever segredos ou
  valores padrão.

## Alternativas consideradas

- **Segredos fixos no `compose.yaml` ou no `.env.example`:** públicos no
  repositório; qualquer pessoa poderia assinar sessões válidas.
- **Serviço de inicialização no Compose que gera o `.env`:** mais uma peça no
  Compose, e o `env_file` é lido antes de o serviço rodar, então a primeira
  subida ainda falharia.
- **Gerar a cada subida, só em memória:** reiniciar o backend derrubaria as
  sessões e mudaria o identificador embaralhado no meio do período de 7 dias.

## Consequências

- `docker compose up` funciona sem `.env`.
- Apagar o volume `secrets` gera segredos novos: as sessões abertas deixam de
  valer (o navegador verifica de novo sozinho) e os registros antigos deixam
  de ser correlacionáveis com os novos.
- Os testes continuam passando os segredos pelo ambiente.
