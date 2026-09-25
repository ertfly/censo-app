# Data Model: Proteção contra bots

Nenhum dado desta feature fica no `censo.sqlite`. Estado em memória do
backend, cookie no navegador e arquivos de registro em volume próprio
([ADR 0019](../../.harness/decisions/0019-registros-de-protecao.md)).

## Desafio (efêmero, gerado pelo `altcha-lib`)

| Campo | Descrição |
|---|---|
| `parameters` (`algorithm`, `nonce`, `salt`, `cost`, `keyLength`, `keyPrefix`, `keySignature`, `expiresAt`) e `signature` | formato v2 do ALTCHA; assinado com `ALTCHA_HMAC_KEY` |
| validade | 5 minutos |

Ciclo: criado → resolvido pelo navegador → verificado uma vez → assinatura
guardada como usada até expirar.

## Sessão (cookie `censo_session`)

| Campo | Descrição |
|---|---|
| `expiresAt` | instante de expiração (30 minutos após a verificação) |
| `id` | identificador aleatório |
| assinatura | `SESSION_SECRET` |

```
sem sessão ──desafio resolvido──► válida ──30 min──► expirada
     ▲                                                   │
     └────────────── próxima consulta: 401 ◄─────────────┘
```

## Contador e bloqueio (memória do backend)

| Estrutura | Chave | Valor |
|---|---|---|
| Contador do rate limit | chave do acesso (IPv4 ou `/64` do IPv6) | requisições na janela de 60 s |
| Mapa de bloqueio | chave do acesso | instante em que o bloqueio termina |
| Desafios usados | assinatura do desafio | instante de expiração |

```
livre ──121ª requisição em 60 s──► bloqueado ──60 s──► livre
```

Perdidos a cada reinício do backend (aceito: bloqueios são curtos).

## Registro de proteção (arquivo JSONL por dia)

| Campo | Tipo | Regra |
|---|---|---|
| `occurredAt` | string ISO 8601 (UTC) | momento do evento |
| `type` | `rate_limit_blocked` \| `verification_failed` | FR-016 |
| `accessId` | string, 16 hex | `HMAC-SHA256(PROTECTION_LOG_KEY, chave do acesso)` truncado |
| `reason` | `invalid_solution` \| `expired_challenge` \| `replayed_challenge` | só em `verification_failed` |

Regras:

- um evento `rate_limit_blocked` por início de bloqueio (não um por
  requisição recusada durante o bloqueio);
- nenhum campo com endereço de rede ou dado do navegador (FR-017);
- arquivos com mais de 7 dias apagados (FR-017).
