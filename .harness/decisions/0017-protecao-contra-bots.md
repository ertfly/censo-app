# 0017. Proteção contra bots com rate limit e ALTCHA local

- Status: Aceito
- Data: 2026-09-25

## Contexto

A aplicação é uma página aberta para consultas, sem cadastro nem e-mail. É
preciso dificultar o processamento de consultas por bots e IAs.

- Os dados são públicos (agregados do censo). O risco principal é carga e
  raspagem em massa, não vazamento.
- Nenhum captcha impede um bot determinado; o objetivo é encarecer o abuso.
- A busca de município usa autocomplete, que faz uma consulta a cada digitação;
  um desafio por consulta é inviável.
- A solução deve ser local, sem serviço de terceiros
  ([ADR 0016](0016-execucao-local.md)).

## Decisão

### Camadas

| Camada | Ferramenta | Versão | Onde roda |
|---|---|---|---|
| Limite de requisições por IP | `@fastify/rate-limit` | 11.2.0 | Backend, memória |
| Desafio de prova de trabalho (servidor) | `altcha-lib` | 2.5.0 | Backend |
| Desafio de prova de trabalho (navegador) | `altcha` (web component) | 3.2.3 | Frontend |
| Sessão | Cookie assinado com `@fastify/cookie` | 11.1.2 | Backend |
| Robôs declarados | `robots.txt` e bloqueio por User-Agent | — | nginx |

Nenhuma camada chama serviço externo. O serviço pago opcional do ALTCHA não é
usado.

### Fluxo

```
1. Página abre → frontend pede desafio        GET  /api/challenge
2. Navegador resolve a prova de trabalho (~1 s, sem interação na maioria dos casos)
3. Frontend envia a solução                    POST /api/session
4. Backend verifica e grava cookie de sessão assinado (HttpOnly, SameSite=Strict)
5. Consultas exigem o cookie; sem ele → 401 com código SESSION_REQUIRED
6. Frontend, ao receber SESSION_REQUIRED, repete o desafio e refaz a consulta
```

- Todas as rotas `/api/*` exigem sessão, exceto `/api/challenge`,
  `/api/session` e o healthcheck.
- O rate limit vale para todas as rotas `/api/*`, com ou sem sessão.
- Excedido o limite: 429 com código `RATE_LIMIT_EXCEEDED`.
- O frontend aplica espera entre digitações (debounce) no autocomplete, para
  não gastar o limite com consultas intermediárias.
- Valores (duração da sessão, requisições por minuto, dificuldade do desafio,
  intervalo do debounce) são definidos no `plan.md` da feature de proteção e
  configuráveis por variável de ambiente.

### IP real atrás do nginx

- O backend só recebe tráfego do nginx. O Fastify é configurado com
  `trustProxy` restrito à rede do Compose, e o nginx envia `X-Forwarded-For`;
  sem isso, todos os usuários teriam o IP do nginx e dividiriam o mesmo limite.

### Segredos

- `ALTCHA_HMAC_KEY` (assinatura dos desafios) e `SESSION_SECRET` (assinatura
  do cookie) vêm de variáveis de ambiente.
- Arquivo `.env` fora do git; `.env.example` versionado, sem valores reais.
- Sem os segredos definidos, o backend não sobe.

### Robôs declarados

- `robots.txt` servido pelo nginx: bloqueia `/api/` para todos e o site
  inteiro para robôs de IA declarados (ex.: GPTBot, ClaudeBot, CCBot,
  Google-Extended).
- O nginx recusa requisições desses User-Agents.
- A lista é mantida em um único arquivo de configuração do nginx.

### Interface

- O widget do ALTCHA exibe textos em pt-BR.
- A verificação segue a skill `frontend-design` como qualquer outro elemento
  visual.

## Alternativas consideradas

- **Captcha de terceiros (Cloudflare Turnstile, hCaptcha, reCAPTCHA):**
  dependem de serviço externo e enviam dados do usuário a terceiros.
- **Anubis (proxy com prova de trabalho):** eficaz contra raspagem por IAs, mas
  adiciona um container e filtra todo o tráfego, inclusive arquivos estáticos.
  Pode ser reavaliado quando houver exposição na internet.
- **Somente rate limit:** resolve carga, mas não oferece barreira contra
  consulta automatizada lenta.
- **Cadastro ou e-mail:** descartado por requisito.

## Consequências

- Bots em escala precisam gastar processamento por sessão e respeitar o limite
  por IP.
- Um bot isolado e paciente ainda consegue consultar; a proteção encarece, não
  impede.
- Rate limit em memória vale para uma instância do backend; mais instâncias
  exigiriam armazenamento compartilhado (novo ADR).
- A proteção tem feature própria no spec-kit, com E2E do fluxo de verificação.
