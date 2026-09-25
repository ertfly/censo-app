# 0023. Primeira versão acessada só por localhost

- Status: Aceito
- Data: 2026-09-25
- Revisa: [ADR 0016](0016-execucao-local.md) (ambiente de acesso)

## Contexto

O ADR 0016 definiu a execução local na primeira versão, "na máquina do
responsável ou em rede interna", sem HTTPS.

Na implementação da feature 003 (tarefa T017), verificou-se que a
verificação contra bots ([ADR 0017](0017-protecao-contra-bots.md)) usa a Web
Crypto (`crypto.subtle`), que os navegadores só disponibilizam em contexto
seguro: HTTPS ou `localhost`. Acessada por `http://<IP da máquina>` na rede
interna, a verificação não roda e nenhuma consulta é possível.

## Decisão

- Na primeira versão, a aplicação é acessada **somente por
  `http://localhost`** na própria máquina onde roda (`docker compose up`).
- O acesso pela rede interna deixa de fazer parte da v1. Ele volta junto com
  o HTTPS, no ADR que tratar da exposição da aplicação (previsto no ADR 0016).

## Alternativas consideradas

- **HTTPS na rede interna com certificado local (mkcert ou autoassinado)**:
  exige que cada aparelho da rede confie no certificado; antecipa uma
  decisão de infraestrutura prevista para a exposição na internet.
- **Verificação alternativa sem Web Crypto**: enfraqueceria a proteção e
  exigiria implementação própria do cálculo.

## Consequências

- Nenhuma mudança de código: o `compose.yaml` já publica a porta no host, e o
  acesso por `localhost` é contexto seguro.
- Os testes E2E acessam por `localhost` (rede do container do frontend), a
  mesma condição do uso real.
- A pendência "acesso pela rede interna exige HTTPS" em `architecture.md` é
  resolvida por este ADR.
