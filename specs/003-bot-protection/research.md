# Research: Proteção contra bots

Fase 0 do plano. Base: [ADR 0017](../../.harness/decisions/0017-protecao-contra-bots.md),
[ADR 0019](../../.harness/decisions/0019-registros-de-protecao.md),
[ADR 0016](../../.harness/decisions/0016-execucao-local.md). APIs conferidas
nos pacotes `altcha-lib` 2.5.0 e `altcha` 3.2.3 em 2026-09-25.

## R1. Desafio ALTCHA

**Decisão**:

- Protocolo **v2** do ALTCHA (o `altcha-lib` 2.5.0 exporta o v2 por padrão;
  conferido no pacote durante a implementação, T008).
- `GET /api/challenge`: `createChallenge` com algoritmo `PBKDF2/SHA-256`
  (`deriveKey` de `altcha-lib/algorithms/pbkdf2`), em modo determinístico:
  contador sorteado entre `ALTCHA_COUNTER_MAX / 2` e `ALTCHA_COUNTER_MAX`,
  `cost` = `ALTCHA_COST` iterações de PBKDF2 por tentativa, assinado com
  `ALTCHA_HMAC_KEY` (e um segundo segredo derivado dele, por HMAC, para a
  assinatura das chaves derivadas), validade de 5 minutos.
- `POST /api/session`: decodifica o payload (base64 de `{ challenge, solution }`)
  e confere com `verifySolution` (assinatura, expiração e solução).
- **Proteção contra reúso**: a assinatura de cada desafio resolvido fica em
  memória (mapa com limite de tamanho e expiração igual à do desafio); a
  mesma solução não abre duas sessões.
- **Dificuldade**: `ALTCHA_COST` × número de tentativas até o contador
  sorteado (limitado por `ALTCHA_COUNTER_MAX`). Os padrões são calibrados na
  implementação (T041) para que a verificação termine em ~1 s num celular
  intermediário, cumprindo o SC-001 (até 3 s em 95% dos casos).
- **Calibragem (T041, 2026-09-25, Ryzen 5 6600H, Chromium do Playwright)**:
  verificação completa, da abertura da página à sessão aberta, com mediana de
  ~590 ms de custo fixo (página e widget, medido com dificuldade mínima). Com
  `ALTCHA_COST=5000`: `COUNTER_MAX=200` somou ~0 ms (cálculo irrelevante, sem
  custo para robôs); `COUNTER_MAX=2000` levou a mediana a 1,06 s. Cálculo puro
  no Node, em uma thread (custo de um robô por sessão): 0,1–0,2 s com 200;
  0,9–1,7 s com 2000. Escolhido **`ALTCHA_COST=5000` e `ALTCHA_COUNTER_MAX=1000`**:
  cerca de 0,8 s de cálculo estimado num celular intermediário (3,5× mais
  lento), com folga para o SC-001. A estimativa de celular não foi medida em
  aparelho real; os valores são configuráveis.

**Motivo**: API confirmada no pacote; sem serviço externo.

**Alternativas**: middleware pronto do `altcha-lib` (`createAltchaGuard`):
exigiria a solução em cada consulta, em vez de uma vez por sessão.

## R2. Sessão

**Decisão**: cookie assinado com `@fastify/cookie`, sem estado no servidor.

| Atributo | Valor |
|---|---|
| Nome | `censo_session` |
| Conteúdo | instante de expiração + identificador aleatório, assinados com `SESSION_SECRET` |
| Validade | 30 minutos fixos a partir da verificação (FR-004), `SESSION_TTL_SECONDS=1800` |
| `HttpOnly` | sim |
| `SameSite` | `Strict` |
| `Path` | `/api` |
| `Secure` | não, enquanto a execução for local sem HTTPS (ADR 0016); obrigatório ao expor |

- Guard em todas as rotas `/api/*`, exceto `/api/challenge`, `/api/session` e
  `/api/health`.
- Sem cookie, com assinatura inválida ou expirado: `401 SESSION_REQUIRED`.

**Motivo**: o cookie é compartilhado por todas as abas e telas do mesmo
navegador (caso de borda "várias abas"); sem armazenamento de sessão.

**Alternativas**: token no `localStorage` com cabeçalho `Authorization`
(exposto a scripts da página); sessão em memória no servidor (perdida a cada
reinício, sem ganho).

## R3. Rate limit com bloqueio de 1 minuto

**Decisão**:

- Contagem num hook global próprio (ADR 0022, que substituiu o
  `@fastify/rate-limit`): 120 por janela de 60 s (`RATE_LIMIT_MAX`,
  `RATE_LIMIT_WINDOW_SECONDS`), antes da exigência de sessão.
- Ao ultrapassar, o acesso entra num mapa de bloqueio em memória por 60 s a
  partir daquele momento (`RATE_LIMIT_BAN_SECONDS`), verificado antes de
  qualquer rota `/api/*` (inclusive `/api/challenge` e `/api/session`).
- Resposta de bloqueio: `429 RATE_LIMIT_EXCEEDED`, cabeçalho `Retry-After` e
  `retryAfterSeconds` no corpo.
- `/api/health` fora do limite.

**Motivo**: a janela fixa do plugin sozinha libera o acesso no fim da janela,
que pode ser antes de 1 minuto; a spec exige bloqueio de 1 minuto a partir do
excesso.

## R4. Chave do acesso e IP real

**Decisão**:

- Chave do acesso: IPv4 completo; IPv6 reduzido ao prefixo `/64` (um mesmo
  cliente costuma controlar o `/64` inteiro).
- O nginx **sobrescreve** `X-Forwarded-For` com `$remote_addr` (não acrescenta),
  impedindo que o cliente forje o cabeçalho.
- O Fastify confia no proxy apenas para a sub-rede fixa da rede do Compose
  (`trustProxy` com CIDR), definida em `compose.yaml`.
- Em desenvolvimento, o proxy do Vite envia o endereço de origem.

## R5. Robôs de IA

**Decisão**:

- `robots.txt` servido pelo nginx: `Disallow: /api/` para todos;
  `Disallow: /` para os robôs de IA listados.
- Bloqueio por User-Agent no nginx (`403`) por um arquivo de configuração
  próprio, `frontend/nginx/ai-bots.conf`, editável sem mexer nas telas
  (FR-013).
- Lista inicial de User-Agents: GPTBot, ChatGPT-User, OAI-SearchBot,
  ClaudeBot, Claude-User, Claude-SearchBot, anthropic-ai, CCBot,
  PerplexityBot, Perplexity-User, Bytespider, Amazonbot, meta-externalagent,
  cohere-ai, Diffbot.
- `Google-Extended` e `Applebot-Extended` só no `robots.txt`: são tokens de
  controle, não User-Agents enviados em requisições.

**Consequência**: só barra quem se identifica; os demais são contidos pelo
desafio e pelo limite (caso de borda "robô que não se identifica").

## R6. Frontend: verificação transparente

**Decisão**:

- Widget `altcha` com `auto="onload"`, `language="pt-br"` e processamento em
  web workers, renderizado de forma discreta no menu fixo
  (`widgets/app-header`), com o texto "Verificando o navegador".
- `shared/api/session.ts`: mantém uma única verificação em andamento; o
  cliente HTTP aguarda a sessão antes de consultar.
- Ao receber `SESSION_REQUIRED`, o cliente refaz a verificação uma vez e
  repete a consulta (FR-005); o estado da tela (texto digitado, UF escolhida)
  não é tocado.
- Ao receber `RATE_LIMIT_EXCEEDED`, a tela mostra a mensagem com contagem
  regressiva a partir de `retryAfterSeconds` e não repete a consulta sozinha.
- `<noscript>` em `index.html` explica que o JavaScript é necessário.

**Motivo**: o widget oficial traz acessibilidade e textos pt-BR; o controle
de uma única verificação evita várias sessões em paralelo.

## R7. Segredos e configuração

| Variável | Padrão | Regra |
|---|---|---|
| `ALTCHA_HMAC_KEY` | — | obrigatória, ≥ 32 caracteres |
| `SESSION_SECRET` | — | obrigatória, ≥ 32 caracteres |
| `PROTECTION_LOG_KEY` | — | obrigatória, ≥ 32 caracteres (ADR 0019) |
| `SESSION_TTL_SECONDS` | 1800 | FR-004 |
| `RATE_LIMIT_MAX` | 120 | FR-008 |
| `RATE_LIMIT_WINDOW_SECONDS` | 60 | FR-008 |
| `RATE_LIMIT_BAN_SECONDS` | 60 | FR-008 |
| `ALTCHA_COST` | calibrado (T041) | R1 |
| `ALTCHA_COUNTER_MAX` | calibrado (T041) | R1 |
| `PROTECTION_LOG_RETENTION_DAYS` | 7 | FR-017 |

Os três segredos devem ser diferentes entre si. O backend não sobe se algum
faltar, for curto ou repetido. `.env.example` traz os nomes, sem valores
reais.

## R8. Testes sem desligar a proteção

**Decisão**: não existe modo que desligue a proteção. Testes de rota (001,
002, 003) e E2E obtêm sessão resolvendo o desafio com `solveChallenge` do
`altcha-lib`, com `ALTCHA_COST` e `ALTCHA_COUNTER_MAX` baixos no ambiente de teste.

**Motivo**: um interruptor de desligar é um risco se chegar à produção.

## R9. Posição na arquitetura

Proteção é assunto de transporte (HTTP), sem regra de domínio: fica em
`backend/src/infra/http/protection/` e `backend/src/infra/logging/`. O
`altcha-lib` só pode ser importado em `infra` (ADR 0011). Nenhum Value Object
novo.
