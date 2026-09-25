# 0020. Stacks de E2E com a proteção ligada

- Status: Aceito
- Data: 2026-09-25
- Complementa: [ADR 0009](0009-testes.md)

## Contexto

Os testes E2E rodam num container Playwright e fazem todas as requisições a
partir de um único endereço de rede. A proteção contra bots
([ADR 0017](0017-protecao-contra-bots.md)) limita cada acesso a 120
requisições por minuto: a suíte completa seria bloqueada e falharia de forma
intermitente. Ao mesmo tempo, os testes da própria proteção precisam dos
valores reais (limite padrão) e de uma validade de sessão curta para testar a
expiração.

Também não pode existir modo que desligue a proteção (spec 003, research R8).

## Decisão

Duas configurações de E2E, ambas sobre o `compose.yaml` de produção, com a
proteção sempre ligada:

| Arquivo | Uso | Valores |
|---|---|---|
| `compose.e2e.yaml` | Suíte geral (001, 002 e fluxos da 003 que não dependem de limite ou expiração) | `RATE_LIMIT_MAX=100000`; demais valores padrão |
| `compose.e2e-protection.yaml` | Testes de limite e expiração da 003 | Valores padrão (`RATE_LIMIT_MAX=120`) e `SESSION_TTL_SECONDS=60` |

- Uso: `docker compose -f compose.yaml -f compose.e2e.yaml up` (e o mesmo com
  `compose.e2e-protection.yaml`), com o serviço Playwright
  (`mcr.microsoft.com/playwright:v1.63.0-noble`) na mesma rede da aplicação.
- As duas stacks usam a cópia do banco em `e2e/.tmp/censo.sqlite`, nunca o
  arquivo versionado.
- Verificações que precisam do Docker (relatório de proteção, logs sem
  endereço de rede) rodam por scripts no host, em `e2e/scripts/`, após a
  suíte.

## Alternativas consideradas

- **Uma stack só com o limite padrão**: a suíte seria bloqueada.
- **Modo de teste que desliga a proteção**: proibido; um interruptor pode
  chegar à produção.
- **Distribuir as requisições entre vários endereços de origem**: complexo e
  frágil dentro do Docker.

## Consequências

- A suíte geral não testa o limite; isso fica a cargo da stack de proteção e
  dos testes de integração com relógio simulado (spec 003).
- Dois ciclos de subida de stack no E2E.
