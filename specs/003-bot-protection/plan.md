# Implementation Plan: Proteção contra bots

**Branch**: `003-bot-protection` (sem branch; trabalho direto na `main`) | **Date**: 2026-09-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-bot-protection/spec.md`

## Summary

Proteção transversal às duas telas, sem cadastro: verificação automática por
prova de trabalho (ALTCHA local) que abre uma sessão de 30 minutos em cookie
assinado; limite de 120 consultas por minuto por acesso com bloqueio de
1 minuto; recusa de robôs de IA declarados; registros de bloqueios e falhas
com identificador embaralhado, sem endereço de rede, por 7 dias.

Abordagem técnica: plugins do Fastify em `infra/http/protection`, registros em
arquivos JSONL num volume próprio ([ADR 0019](../../.harness/decisions/0019-registros-de-protecao.md)),
`robots.txt` e bloqueio por User-Agent no nginx, widget ALTCHA discreto no
menu fixo e cliente HTTP que refaz a verificação sozinho.

## Technical Context

**Language/Version**: TypeScript 6.0.3 sobre Node.js 24.21.0 LTS

**Primary Dependencies**: `@fastify/cookie` 11.1.2 (o limite de consultas é próprio, ADR 0022), `altcha-lib` 2.5.0, `altcha` 3.2.3, nginx 1.30.5 (já na [stack.md](../../.harness/stack.md)); nenhuma dependência nova

**Storage**: memória do backend (contador, bloqueios, desafios usados); cookie no navegador; arquivos JSONL em volume Docker `protection-log`. Nada no `censo.sqlite`

**Testing**: Vitest 5.0.2, Playwright 1.63.0; sessão obtida com `solveChallenge` (research R8)

**Target Platform**: Docker Compose local, sem HTTPS ([ADR 0016](../../.harness/decisions/0016-execucao-local.md))

**Project Type**: aplicação web (monorepo)

**Performance Goals**: verificação em até 3 s em 95% das aberturas (SC-001); guard de sessão e contagem do limite sem custo perceptível por consulta

**Constraints**: nenhum serviço de terceiros; nenhum endereço de rede em logs; sem modo que desligue a proteção; uma instância do backend

**Scale/Scope**: 2 rotas novas, 1 guard e 1 limite aplicados a todas as rotas `/api/*`, 1 relatório

## Constitution Check

*GATE: verificado antes da fase 0 e novamente após a fase 1.*

| Princípio | Verificação | Situação |
|---|---|---|
| I. Documentação antes do código | Spec clarificada; ADR 0019 registrado antes do plano | ✅ |
| II. Somente leitura | Nada gravado no `censo.sqlite`; registros em volume separado (ADR 0019 trata a distinção) | ✅ |
| III. Arquitetura e fronteiras | Proteção só em `infra` (transporte); `altcha-lib` restrito a `infra`; frontend: `shared/api/session` e status no `widgets/app-header` | ✅ |
| IV. Contrato único | Rotas de desafio e sessão e erros comuns em `@censo/contracts` ([contracts/api.md](contracts/api.md)) | ✅ |
| V. Testes por camada | Unitário, integração e E2E definidos ([quickstart.md](quickstart.md)); sem interruptor de desligar | ✅ |
| VI. Idioma | Rotas `/api/challenge`, `/api/session`; códigos em inglês; mensagens e widget em pt-BR | ✅ |
| VII. Versões estáveis | Nenhuma dependência nova | ✅ |
| VIII. Docker | Volume `protection-log`; relatório via `docker compose exec` | ✅ |
| IX. Design | [design.md](design.md) com o sistema visual da skill `frontend-design` | ✅ |

Nenhuma violação. Pós-fase 1: mantido.

**Impacto nas features 001 e 002**: suas rotas passam a exigir sessão; os
testes de rota e E2E delas precisam obter sessão (research R8). Isso define a
ordem de implementação na etapa de tarefas.

## Project Structure

### Documentation (this feature)

```text
specs/003-bot-protection/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── design.md
├── quickstart.md
├── contracts/api.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks (ainda não criado)
```

### Source Code (repository root)

Apenas o que esta feature adiciona à fundação da 001.

```text
.env.example                              # + ALTCHA_HMAC_KEY, SESSION_SECRET, PROTECTION_LOG_KEY e limites
compose.yaml                              # + volume protection-log, sub-rede fixa, variáveis

packages/contracts/src/
├── session/
│   ├── get-challenge.contract.ts
│   └── create-session.contract.ts
└── common/error-response.contract.ts     # + retryAfterSeconds opcional

backend/src/
├── infra/
│   ├── config/protection-config.ts       # leitura e validação das variáveis (research R7)
│   ├── http/protection/
│   │   ├── access-key.ts                 # IPv4 / prefixo /64 do IPv6
│   │   ├── rate-limit.plugin.ts          # contador + bloqueio de 60 s
│   │   ├── session.plugin.ts             # cookie assinado + guard
│   │   ├── challenge-store.ts            # desafios usados (anti-reúso)
│   │   └── session.routes.ts             # /api/challenge, /api/session
│   ├── http/server.ts                    # trustProxy por CIDR; logger sem endereço
│   └── logging/
│       ├── protection-event-log.ts       # JSONL por dia, identificador embaralhado
│       ├── protection-log-retention.ts   # descarte > 7 dias
│       └── protection-report.ts          # npm run protection:report
└── test/…

frontend/
├── nginx.conf                            # X-Forwarded-For sobrescrito; log sem endereço; ai-bots
├── nginx/ai-bots.conf                    # User-Agents recusados (editável)
├── public/robots.txt
└── src/
    ├── index.html                        # <noscript>
    ├── shared/api/
    │   ├── session.ts                    # verificação única, reverificação em 401
    │   └── http-client.ts                # aguarda sessão; trata 401 e 429
    └── widgets/app-header/               # status da verificação, avisos de falha e bloqueio
```

**Structure Decision**: a proteção é preocupação de transporte, sem regra de
domínio; fica inteira em `infra` no backend e em `shared/api` + `widgets` no
frontend, sem criar camadas novas.

## Complexity Tracking

Nenhuma violação da constituição a justificar.
