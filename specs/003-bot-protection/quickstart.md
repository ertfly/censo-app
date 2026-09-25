# Quickstart: validar a Proteção contra bots

Pré-requisitos e forma de subir a aplicação iguais aos da
[feature 001](../001-municipality-search/quickstart.md). O `.env` precisa dos
três segredos (research R7).

## Cenários manuais

| # | Ação | Resultado esperado | Requisito |
|---|---|---|---|
| 1 | Abrir `/municipalities` | Status "Verificando o navegador" no menu some em até 3 s; campos habilitados; nenhum pedido de cadastro | FR-001, FR-002, FR-006 |
| 2 | Fazer várias buscas nas duas telas | Nenhuma nova verificação | FR-003, FR-004 |
| 3 | Abrir a outra tela em nova aba | Não verifica de novo | FR-004 |
| 4 | Com `SESSION_TTL_SECONDS=60`, digitar na busca após 1 minuto | Reverificação automática; sugestões aparecem sem perder o texto | FR-005 |
| 5 | `curl` em `/api/municipalities/suggestions?q=sao` sem cookie | `401 SESSION_REQUIRED` | FR-003 |
| 6 | Repetir a mesma solução do desafio em `POST /api/session` | `400 VERIFICATION_FAILED`; evento `replayed_challenge` registrado | FR-007, FR-016 |
| 7 | Com sessão válida, disparar 121 requisições em menos de 60 s | A 121ª e seguintes: `429` com `Retry-After`; tela mostra contagem regressiva | FR-008, FR-009 |
| 8 | Aguardar 60 s após o bloqueio | Consultas voltam a funcionar | FR-008 |
| 9 | Usar as duas telas normalmente por 10 minutos | Nenhum bloqueio | FR-010, SC-002 |
| 10 | `curl -A "GPTBot" /` e `/api/health` | `403` | FR-011 |
| 11 | `GET /robots.txt` | `Disallow: /api/` para todos e `Disallow: /` para robôs de IA | FR-012 |
| 12 | `docker compose exec backend npm run protection:report` | Bloqueios e falhas por dia, sem endereço de rede | FR-016, FR-018 |
| 13 | Conferir logs do backend e do nginx | Nenhum endereço de rede | FR-017, ADR 0019 |

## Testes automatizados

| Nível | O que cobre |
|---|---|
| Unitário | Chave do acesso (IPv4, `/64` do IPv6); identificador embaralhado; descarte por data; validação dos segredos na inicialização |
| Integração | `fastify.inject()`: desafio → sessão → consulta; reúso de solução; sessão expirada; bloqueio de 60 s a partir do excesso; `/api/health` fora do limite e da sessão; registros gravados sem endereço |
| E2E | Cenários 1, 4, 7 e 10 no navegador e via requisições diretas |

Os testes obtêm sessão resolvendo o desafio com `solveChallenge` e dificuldade
baixa; não existe modo que desligue a proteção (research R8).
