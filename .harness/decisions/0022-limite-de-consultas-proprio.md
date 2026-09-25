# 0022. Limite de consultas no hook global, sem @fastify/rate-limit

- Status: Aceito
- Data: 2026-09-25
- Revisa: [ADR 0017](0017-protecao-contra-bots.md) (ferramenta do limite de consultas)

## Contexto

O ADR 0017 escolheu o `@fastify/rate-limit` para limitar as requisições por
acesso. Na implementação (tarefa T034 da feature 003), dois problemas
apareceram:

- o plugin conta as requisições em hooks por rota, que rodam depois dos hooks
  globais. A exigência de sessão é global e responde 401 antes, então nada era
  contado;
- requisições para rotas inexistentes nunca passam por hooks de rota: um robô
  poderia fazer requisições sem limite para qualquer caminho em `/api/`.

Além disso, o bloqueio de 1 minuto a partir do excesso (spec 003 FR-008) já
exigia um mapa próprio, e a janela do plugin usa o relógio real, o que impedia
testar o bloqueio com o relógio injetado.

## Decisão

- O limite é contado no mesmo hook global (`onRequest`) do bloqueio, em
  `backend/src/infra/http/protection/rate-limit.plugin.ts`, registrado antes
  da exigência de sessão.
- Janela fixa por acesso (`RATE_LIMIT_WINDOW_SECONDS`), com contagem até
  `RATE_LIMIT_MAX`; ao exceder, bloqueio de `RATE_LIMIT_BAN_SECONDS` a partir do
  excesso, registro de um evento e resposta 429 com `Retry-After`.
- Vale para toda requisição `/api/*`, exceto `/api/health`, inclusive rotas
  inexistentes e as rotas da verificação.
- Acessos com janela e bloqueio vencidos são removidos a cada minuto.
- O `@fastify/rate-limit` sai do projeto.

## Alternativas consideradas

- **Manter o plugin e tornar a exigência de sessão um hook por rota**: rotas
  inexistentes continuariam fora do limite.
- **Plugin com armazenamento próprio**: resolve o relógio, não a ordem dos hooks.

## Consequências

- Uma dependência a menos.
- Limite e bloqueio no mesmo lugar, testados com relógio controlado.
- Continua valendo para uma instância do backend (memória local), como no
  ADR 0017.
