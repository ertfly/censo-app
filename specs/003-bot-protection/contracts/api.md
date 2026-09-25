# Contratos da API: Proteção contra bots

Schemas em `@censo/contracts` (ADR 0013).

```
packages/contracts/src/session/
├── get-challenge.contract.ts
└── create-session.contract.ts
packages/contracts/src/common/error-response.contract.ts   # + campo opcional retryAfterSeconds
```

## GET /api/challenge

Gera um desafio. Não exige sessão; sujeito ao limite de consultas.

**200** (formato v2 do ALTCHA, conferido no `altcha-lib` 2.5.0)

```json
{
    "parameters": {
        "algorithm": "PBKDF2/SHA-256",
        "nonce": "4d5e…",
        "salt": "a1b2…",
        "cost": 5000,
        "keyLength": 32,
        "keyPrefix": "9f8e…",
        "keySignature": "…",
        "expiresAt": 1790000000
    },
    "signature": "7c6b…"
}
```

## POST /api/session

Troca a solução do desafio por uma sessão. Não exige sessão; sujeito ao
limite.

**Corpo**

```json
{ "payload": "eyJhbGdvcml0aG0iOi…" }
```

`payload`: base64 de `{ challenge, solution }` produzido pelo widget ALTCHA (protocolo v2), em que `solution` é `{ counter, derivedKey, time? }`.

**200**: grava o cookie `censo_session` e responde

```json
{ "expiresAt": "2026-09-25T15:30:00.000Z" }
```

**Erros**

| Status | Código | Quando | Registro |
|---|---|---|---|
| 400 | `VERIFICATION_FAILED` | solução inválida, desafio expirado ou já usado | `verification_failed` com o motivo |

## Erros comuns a todas as rotas `/api/*`

| Status | Código | Quando | Corpo |
|---|---|---|---|
| 401 | `SESSION_REQUIRED` | sem sessão, sessão inválida ou expirada (exceto `/api/challenge`, `/api/session`, `/api/health`) | `{ "code": "SESSION_REQUIRED" }` |
| 429 | `RATE_LIMIT_EXCEEDED` | acesso bloqueado | `{ "code": "RATE_LIMIT_EXCEEDED", "retryAfterSeconds": 42 }` + cabeçalho `Retry-After: 42` |

`/api/health` não exige sessão nem entra no limite.

## Respostas do nginx

| Situação | Resposta |
|---|---|
| User-Agent de robô de IA listado | `403`, sem corpo de aplicação |
| `GET /robots.txt` | regras para robôs (research R5) |

## Mensagens do frontend por código

| Código | Mensagem |
|---|---|
| `VERIFICATION_FAILED` | A verificação automática não foi concluída. Tentar de novo. |
| `RATE_LIMIT_EXCEEDED` | Você fez muitas consultas em pouco tempo. Aguarde {n} segundos para consultar de novo. |
| `SESSION_REQUIRED` | Não exibida: o frontend refaz a verificação e repete a consulta. |
| Navegador sem suporte | Seu navegador não conseguiu fazer a verificação automática. Use um navegador atualizado com JavaScript ativado. |
