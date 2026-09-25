---
description: "Tarefas da feature 003 (Proteção contra bots)"
---

# Tasks: Proteção contra bots

**Input**: `specs/003-bot-protection/` (plan.md, spec.md, research.md, data-model.md, contracts/api.md, design.md, quickstart.md)

**Prerequisites**: fases 1 e 2 de [specs/001-municipality-search/tasks.md](../001-municipality-search/tasks.md) (fundação do projeto)

**Tests**: obrigatórios por camada (Princípio V). Não existe modo que desligue a proteção: os testes obtêm sessão resolvendo o desafio com `solveChallenge` e dificuldade baixa (research R8). E2E: fluxos gerais na stack `compose.e2e.yaml`; limite e expiração na stack `compose.e2e-protection.yaml`, com os valores reais ([ADR 0020](../../.harness/decisions/0020-stacks-de-e2e.md)).

**Posição na ordem do projeto**: implementada logo após a fundação, antes das user stories da 001 e da 002. O helper de sessão criado aqui (T023) é usado pelos testes de rota da 001 e da 002.

## Regras de execução

Mesmas da [001](../001-municipality-search/tasks.md#regras-de-execução): um commit por tarefa, tudo em container, versões do `stack.md`, skill `frontend-design` em toda tarefa de interface, código em inglês e textos em pt-BR.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo
- **[Story]**: US1 (verificação e sessão) ou US2 (limite e robôs)

---

## Phase 1: Setup

- [X] T001 Adicionar ao `backend/package.json` as dependências `@fastify/cookie` 11.1.2, `@fastify/rate-limit` 11.2.0 e `altcha-lib` 2.5.0, e ao `frontend/package.json` a dependência `altcha` 3.2.3; atualizar `package-lock.json` no container
- [X] T002 [P] Acrescentar ao `.env.example`: `ALTCHA_HMAC_KEY=`, `SESSION_SECRET=`, `PROTECTION_LOG_KEY=` (vazios, com comentário: "obrigatórios, pelo menos 32 caracteres, diferentes entre si"), `SESSION_TTL_SECONDS=1800`, `RATE_LIMIT_MAX=120`, `RATE_LIMIT_WINDOW_SECONDS=60`, `RATE_LIMIT_BAN_SECONDS=60`, `ALTCHA_COST=` e `ALTCHA_COUNTER_MAX=` (valores calibrados em T041; protocolo v2 do ALTCHA), `PROTECTION_LOG_RETENTION_DAYS=7`, `TRUSTED_PROXY_CIDR=172.28.0.0/24` (research R7)
- [X] T003 [P] Em `compose.yaml` e `compose.dev.yaml`: volume nomeado `protection-log` montado em `/var/lib/censo/protection-log` no `backend` (gravável), variável `PROTECTION_LOG_DIR` apontando para ele, e as variáveis da T002 repassadas via `env_file` ([ADR 0019](../../.harness/decisions/0019-registros-de-protecao.md))

---

## Phase 2: Foundational

**Purpose**: configuração, chave do acesso, contratos e registros, usados pelas duas stories.

- [X] T004 Criar `backend/src/infra/config/protection-config.ts`: lê e valida as variáveis de research R7; o backend não sobe se `ALTCHA_HMAC_KEY`, `SESSION_SECRET` ou `PROTECTION_LOG_KEY` faltarem, tiverem menos de 32 caracteres ou forem iguais entre si; números com os padrões `1800`, `120`, `60`, `60`, `7`
- [X] T005 [P] Teste unitário `backend/test/unit/infra/protection-config.test.ts`: segredo ausente, curto, repetido; padrões numéricos; valores inválidos
- [X] T006 [P] Criar `backend/src/infra/http/protection/access-key.ts`: IPv4 completo; IPv6 reduzido ao prefixo `/64`; IPv4 mapeado em IPv6 (`::ffff:a.b.c.d`) tratado como IPv4 (research R4)
- [X] T007 [P] Teste unitário `backend/test/unit/infra/access-key.test.ts`: IPv4, IPv6 do mesmo `/64` geram a mesma chave, IPv6 de `/64` diferentes geram chaves diferentes, IPv4 mapeado
- [X] T008 [P] Estender `packages/contracts/src/common/error-response.contract.ts` com `retryAfterSeconds` opcional (inteiro ≥ 1) e criar `packages/contracts/src/session/get-challenge.contract.ts` (formato v2: `parameters` e `signature`) e `create-session.contract.ts` (entrada `{ payload: string }`, saída `{ expiresAt: string }` em ISO 8601); exportar no `index.ts`
- [X] T009 Criar `backend/src/infra/logging/protection-event-log.ts`: grava um evento JSON por linha em `PROTECTION_LOG_DIR/protection-events-AAAA-MM-DD.jsonl` (data em UTC) com os campos "`occurredAt` (ISO 8601, UTC), `type` (`rate_limit_blocked` \| `verification_failed`), `accessId` (`HMAC-SHA256(PROTECTION_LOG_KEY, chave do acesso)` truncado em 16 hexadecimais), `reason` (`invalid_solution` \| `expired_challenge` \| `replayed_challenge`, só em `verification_failed`)"; falha de gravação é ignorada sem interromper a requisição (FR-020)
- [X] T010 [P] Criar `backend/src/infra/logging/protection-log-retention.ts`: apaga arquivos com data anterior a `PROTECTION_LOG_RETENTION_DAYS` dias (UTC) na inicialização e a cada hora
- [X] T011 [P] Criar `backend/src/infra/logging/protection-report.ts` e o script `protection:report` no `backend/package.json`: resume, por dia, quantidade de bloqueios, de falhas por motivo e os 10 `accessId` mais frequentes (FR-018)
- [X] T012 [P] Testes `backend/test/unit/infra/protection-event-log.test.ts`, `protection-log-retention.test.ts` e `protection-report.test.ts` em diretório temporário: formato de cada campo, nenhum campo com endereço de rede, mesmo acesso gera o mesmo `accessId`, falha de gravação não lança, descarte por data UTC, resumo do relatório

**Checkpoint**: base da proteção pronta.

---

## Phase 3: User Story 1 - Consultar sem cadastro, com verificação automática (Priority: P1) 🎯 MVP

**Goal**: verificação automática ao abrir a página, sessão de 30 minutos em cookie assinado, consultas recusadas sem sessão, reverificação transparente.

**Independent Test**: cenários 1 a 9 da US1 da spec; quickstart cenários 1 a 6.

### Tests for User Story 1

- [X] T013 [P] [US1] Teste unitário `backend/test/unit/infra/challenge-store.test.ts`: assinatura usada é recusada até expirar; entradas expiradas saem; limite de tamanho respeitado
- [X] T014 [P] [US1] Teste de integração `backend/test/integration/http/session.test.ts` com `fastify.inject()` e uma rota protegida registrada só no teste: `GET /api/challenge` no formato do contrato; `POST /api/session` com solução válida grava `censo_session` (`HttpOnly`, `SameSite=Strict`, `Path=/api`, sem `Secure`) e responde `expiresAt` 30 minutos à frente; solução inválida, desafio expirado e solução repetida → `400 VERIFICATION_FAILED` com evento `verification_failed` e o motivo correto; rota protegida sem cookie, com cookie adulterado ou expirado (relógio simulado) → `401 SESSION_REQUIRED`; `/api/health` sem cookie → `200`
- [X] T015 [P] [US1] Teste unitário `frontend/test/unit/shared/session.test.ts`: uma única verificação em andamento mesmo com várias consultas simultâneas; `SESSION_REQUIRED` refaz a verificação uma vez e repete a consulta; segunda recusa seguida não entra em repetição infinita
- [X] T016 [P] [US1] Teste de componente `frontend/test/unit/widgets/verification-status.test.ts`: "Verificando o navegador" durante a verificação, nada após concluir, "Verificação não concluída" com aviso e botão "Tentar de novo" em falha, texto de navegador sem suporte sem botão, região `aria-live="polite"`
- [X] T017 [P] [US1] Testes E2E: `e2e/tests/verification.spec.ts` na stack `compose.e2e.yaml` (quickstart cenários 1 e 3, cenário 5 via requisição direta sem cookie, e página com `javaScriptEnabled: false` mostrando a mensagem de JavaScript, FR-022) e `e2e/tests/protection/session-expiry.spec.ts` na stack `compose.e2e-protection.yaml` (quickstart cenário 4, com `SESSION_TTL_SECONDS=60`: expiração ao recarregar e recusa do cookie vencido; a expiração durante a digitação na busca é coberta no E2E da busca, US1 da 001, pois a tela ainda não existe nesta etapa). Na implementação: o container de E2E usa a rede do frontend (`network_mode: service:frontend`) e acessa `http://localhost`, pois a Web Crypto da verificação só existe em contexto seguro (HTTPS ou localhost)

### Implementation for User Story 1

- [X] T018 [P] [US1] Criar `backend/src/infra/http/protection/challenge-store.ts`: mapa em memória de assinaturas usadas com expiração igual à do desafio (5 minutos) e limite de tamanho (research R1)
- [X] T019 [US1] Criar `backend/src/infra/http/protection/session.routes.ts`: `GET /api/challenge` com `createChallenge` do `altcha-lib` v2 (`PBKDF2/SHA-256`, `ALTCHA_HMAC_KEY`, `ALTCHA_COST`, contador sorteado até `ALTCHA_COUNTER_MAX`, validade de 5 minutos) e `POST /api/session` com `verifySolution`, recusa de reúso pelo `challenge-store`, registro de falhas com motivo (T009) e gravação do cookie `censo_session` assinado com `SESSION_SECRET` contendo expiração e identificador aleatório (research R2)
- [X] T020 [US1] Criar `backend/src/infra/http/protection/session.plugin.ts`: registra `@fastify/cookie` e um hook `onRequest` que exige sessão válida em todas as rotas `/api/*`, exceto `/api/challenge`, `/api/session` e `/api/health`; ausência, assinatura inválida ou expiração → `401 SESSION_REQUIRED`; validade de 30 minutos fixos, sem renovação pelo uso (FR-004)
- [X] T021 [US1] Registrar configuração, retenção de registros, plugin de sessão e rotas de sessão em `backend/src/main.ts` e `backend/src/infra/http/server.ts`
- [X] T022 [P] [US1] Acrescentar ao `backend/test/helpers/` um `create-test-server.ts` que monta o servidor completo sobre o banco de teste com segredos e `ALTCHA_COST`/`ALTCHA_COUNTER_MAX` baixos definidos só no teste
- [X] T023 [US1] Criar `backend/test/helpers/create-session.ts`: pede `/api/challenge`, resolve com `solveChallenge` do `altcha-lib`, envia a `/api/session` e devolve o cabeçalho `cookie` pronto para as requisições dos testes da 001 e da 002; e `e2e/helpers/api-session.ts` com o mesmo fluxo para testes E2E feitos por requisição direta
- [X] T024 [US1] Criar `frontend/src/shared/api/session.ts`: estado da verificação (`idle`, `verifying`, `verified`, `failed`, `unsupported`), uma única verificação em andamento, função `ensureSession()` usada pelo cliente HTTP
- [X] T025 [US1] Integrar `frontend/src/shared/api/http-client.ts` com `session.ts`: aguarda `ensureSession()` antes de consultar; em `401 SESSION_REQUIRED` refaz a verificação uma vez e repete a consulta, sem alterar o estado das páginas (FR-005)
- [X] T026 [US1] Invocar a skill `frontend-design` e criar `frontend/src/widgets/app-header/ui/VerificationStatus.vue`: widget `altcha` com `auto="onload"`, `language="pt-br"` e web workers, ouvindo o evento de verificação concluída do widget para enviar o `payload` a `POST /api/session` via `session.ts`, apresentado como status discreto no menu fixo, com os estados de [design.md](design.md#menu-fixo-com-status); ligar ao `session.ts` e expor o estado para as páginas (campos desabilitados com `aria-disabled` e explicação durante a verificação, FR-006)
- [X] T027 [US1] Criar o aviso de falha em `frontend/src/widgets/app-header/ui/ProtectionNotice.vue` ("A verificação automática não foi concluída." + "Tentar de novo"; navegador sem suporte com texto explicativo e sem botão; `role="alert"`) e renderizá-lo em `frontend/src/app/ui/AppLayout.vue` acima do conteúdo
- [X] T028 [P] [US1] Adicionar `<noscript>` em `frontend/index.html`: "Esta consulta precisa de JavaScript ativado no navegador." (FR-022)

**Checkpoint**: consultas só com sessão; verificação transparente para o visitante.

---

## Phase 4: User Story 2 - Limitar acessos automatizados (Priority: P1)

**Goal**: 120 requisições por minuto por acesso, bloqueio de 1 minuto a partir do excesso, recusa de robôs de IA declarados, regras para robôs.

**Independent Test**: cenários 1 a 8 da US2 da spec; quickstart cenários 7 a 13.

### Tests for User Story 2

- [X] T029 [P] [US2] Teste de integração `backend/test/integration/http/rate-limit.test.ts` com relógio simulado: 120 requisições passam; a 121ª recebe `429 RATE_LIMIT_EXCEEDED` com `Retry-After` e `retryAfterSeconds`; o bloqueio dura 60 s a partir do excesso, e não até o fim da janela; `/api/challenge` e `/api/session` contam no limite e são recusados durante o bloqueio; `/api/health` fica fora; acessos diferentes não se afetam; uso normal (30 requisições por minuto durante 10 minutos simulados) nunca bloqueia (SC-002); 3 visitantes na mesma rede somando 90 por minuto não são bloqueados (US2 cenário 7); IPv6 do mesmo `/64` compartilha o limite; exatamente um evento `rate_limit_blocked` por início de bloqueio
- [X] T030 [P] [US2] Teste de integração `backend/test/integration/http/trusted-proxy.test.ts`: com `X-Forwarded-For` vindo de endereço dentro de `TRUSTED_PROXY_CIDR`, a chave do acesso usa o valor do cabeçalho; vindo de fora, o cabeçalho é ignorado
- [X] T031 [P] [US2] Teste unitário `frontend/test/unit/shared/rate-limit-notice.test.ts`: `429` mostra "Você fez muitas consultas em pouco tempo. Aguarde {n} segundos para consultar de novo." com contagem regressiva a partir de `retryAfterSeconds`; campos desabilitados durante o bloqueio; ao terminar, o aviso some e a consulta recusada não é repetida sozinha (FR-021); anúncio a leitores de tela só no início e no fim
- [ ] T032 [P] [US2] Teste E2E `e2e/tests/protection/rate-limit.spec.ts` na stack `compose.e2e-protection.yaml`: quickstart cenários 7 e 8 por requisição direta com sessão (`e2e/helpers/api-session.ts`) e aviso de bloqueio no navegador
- [ ] T033 [P] [US2] Teste E2E `e2e/tests/ai-bots.spec.ts`: User-Agents `GPTBot` e `ClaudeBot` recebem `403` em `/` e em `/api/health`; `/robots.txt` contém `Disallow: /api/` para todos e `Disallow: /` para os robôs de IA (quickstart cenários 10 e 11)

### Implementation for User Story 2

- [X] T034 [US2] Criar `backend/src/infra/http/protection/rate-limit.plugin.ts`: contagem num hook global próprio (ADR 0022: o `@fastify/rate-limit` conta em hooks por rota, depois da exigência de sessão, e não vê rotas inexistentes), com `RATE_LIMIT_MAX`, janela `RATE_LIMIT_WINDOW_SECONDS` e a chave do acesso (T006), fora `/api/health`; ao exceder, grava no mapa de bloqueio em memória o fim do bloqueio (`agora + RATE_LIMIT_BAN_SECONDS`) e registra `rate_limit_blocked`; hook `onRequest` que, antes de qualquer rota `/api/*` exceto `/api/health`, responde `429` com `Retry-After` e `retryAfterSeconds` enquanto o bloqueio durar (research R3)
- [X] T035 [US2] Registrar o plugin de rate limit em `backend/src/infra/http/server.ts` antes do plugin de sessão
- [X] T036 [US2] Invocar a skill `frontend-design` e estender `frontend/src/widgets/app-header/ui/ProtectionNotice.vue` e `frontend/src/shared/api/http-client.ts` com o estado de bloqueio: aviso com contagem regressiva ([design.md](design.md#aviso-de-bloqueio)), campos desabilitados enquanto durar, sem repetição automática
- [X] T037 [P] [US2] Criar `frontend/nginx/ai-bots.conf` com um `map $http_user_agent $is_ai_bot` para GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-User, Claude-SearchBot, anthropic-ai, CCBot, PerplexityBot, Perplexity-User, Bytespider, Amazonbot, meta-externalagent, cohere-ai e Diffbot, e incluí-lo em `frontend/nginx.conf` respondendo `403` quando `$is_ai_bot` for verdadeiro (research R5); copiar o arquivo no `frontend/Dockerfile`
- [ ] T038 [P] [US2] Criar `frontend/public/robots.txt`: `User-agent: *` com `Disallow: /api/`; e, para cada robô de IA da T037 mais `Google-Extended` e `Applebot-Extended`, `Disallow: /`

**Checkpoint**: proteção completa.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T039 [P] Criar `e2e/scripts/check-protection-report.sh`, executado no host após a stack de proteção: roda `docker compose exec backend npm run protection:report` e confere que o bloqueio e a falha de verificação provocados pelos testes aparecem, sem endereço de rede (quickstart cenário 12)
- [ ] T040 [P] Criar `e2e/scripts/check-no-ip-in-logs.sh`, executado no host após as duas stacks: busca padrões de IPv4 e IPv6 em `docker compose logs backend frontend` e falha se encontrar algum (quickstart cenário 13, FR-019); incluir no `e2e/scripts/run.sh`
- [ ] T041 Calibrar `ALTCHA_COST` e `ALTCHA_COUNTER_MAX` para a verificação terminar em cerca de 1 s num celular intermediário e em até 3 s em 95% das aberturas (SC-001); registrar o valor em `.env.example` e em `research.md`
- [ ] T042 Rodar lint, formatação, todos os testes e o quickstart manual ([quickstart.md](quickstart.md)); registrar desvios em `.harness/` se houver

---

## Dependencies & Execution Order

- **Fundação da 001 (fases 1 e 2) → Fase 1 desta feature**.
- **Fase 1 → Fase 2 → US1 → US2**: a US2 reusa a chave do acesso, os registros e o aviso criado na US1.
- **Esta feature → US1 da 001**: os testes da 001 usam `create-session.ts` (T023).
- Dentro de cada story: testes primeiro (devem falhar), depois implementação.

## Parallel Example: User Story 1

```text
T013, T014, T015, T016, T017   (testes)
T018, T022, T028               (arquivos independentes)
```

## Implementation Strategy

1. Setup e Foundational (configuração, chave do acesso, registros).
2. US1: nenhuma rota consultável sem sessão; verificação transparente.
3. US2: limite, bloqueio, robôs.
4. Polish: registros sem endereço, calibragem da dificuldade.
5. Seguir para a fase 3 da 001.
