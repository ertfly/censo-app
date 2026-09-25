# 0016. Execução local na primeira versão

- Status: Aceito (ambiente de acesso revisto pelo [ADR 0023](0023-v1-somente-localhost.md))
- Data: 2026-09-25
- Complementa: [ADR 0005](0005-docker-compose.md)

## Contexto

O ADR 0005 definiu como a aplicação sobe (Docker Compose), mas não onde ela
roda. A aplicação é uma página aberta para consultas, o que em algum momento
implica exposição a usuários externos.

## Decisão

- Na primeira versão, a aplicação roda **localmente**: na máquina do
  responsável ou em rede interna, via `docker compose up`.
- Sem HTTPS, domínio ou certificado nesta fase.
- A proteção contra bots ([ADR 0017](0017-protecao-contra-bots.md)) é
  construída e testada desde já, para estar pronta quando houver exposição.
- Expor a aplicação na internet exige novo ADR, cobrindo no mínimo: servidor,
  domínio, HTTPS e revisão da proteção contra bots.

## Alternativas consideradas

- **Publicar na internet desde a v1:** traria HTTPS, domínio e operação de
  servidor antes de a funcionalidade principal estar pronta.

## Consequências

- Cookies de sessão funcionam sem o atributo `Secure` enquanto não houver
  HTTPS; ao expor, o atributo passa a ser obrigatório.
- Nenhum bot externo alcança a aplicação nesta fase; a proteção é validada por
  testes, não por tráfego real.
