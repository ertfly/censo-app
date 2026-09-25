# 0019. Registros de proteção sem endereço de rede

- Status: Aceito
- Data: 2026-09-25
- Complementa: [ADR 0017](0017-protecao-contra-bots.md)

## Contexto

A spec 003 exige que cada bloqueio por excesso de consultas e cada falha de
verificação seja registrado com data, hora, tipo e um identificador
embaralhado do acesso, sem o endereço de rede, descartado após 7 dias e
consultável pelo responsável (FR-016 a FR-018).

O ADR 0017 não trata de registros. Além disso:

- o logger do Fastify registra, por padrão, o endereço de origem de cada
  requisição;
- o log de acesso padrão do nginx registra `$remote_addr`.

Sem ajuste, o endereço de rede de todo visitante ficaria nos logs, mesmo com
os registros de proteção corretos.

## Decisão

### Nenhum log com endereço de rede

- O logger do Fastify usa serializador de requisição sem endereço nem porta
  de origem.
- O nginx usa um formato de log de acesso próprio, sem `$remote_addr` e sem
  `$http_x_forwarded_for`.
- Regra geral: nenhum log da aplicação contém endereço de rede.

### Identificador embaralhado

- `HMAC-SHA256(PROTECTION_LOG_KEY, chave-do-acesso)`, truncado em 16
  caracteres hexadecimais.
- A chave do acesso é a mesma usada pelo rate limit: endereço IPv4 completo ou
  o prefixo `/64` do IPv6.
- `PROTECTION_LOG_KEY`: segredo de pelo menos 32 caracteres, vindo de variável
  de ambiente, diferente dos segredos do ALTCHA e da sessão. Sem ele, o backend
  não sobe.
- Com a chave em segredo, o identificador não permite recuperar o endereço;
  quem tiver a chave consegue testar endereços por força bruta. Por isso a
  chave nunca é registrada nem versionada.

### Armazenamento

- Arquivos de texto com um evento JSON por linha, um arquivo por dia (UTC):
  `protection-events-AAAA-MM-DD.jsonl`.
- Pasta em volume nomeado do Docker (`protection-log`), montado no container
  do backend. Não é o banco: o `censo.sqlite` continua somente leitura
  ([ADR 0007](0007-primeira-versao-somente-leitura.md)).
- Campos de cada evento: `occurredAt` (ISO 8601, UTC), `type`
  (`rate_limit_blocked` ou `verification_failed`), `accessId`
  (identificador embaralhado), `reason` (só para falhas: `invalid_solution`,
  `expired_challenge`, `replayed_challenge`).

### Descarte

- Na inicialização do backend e a cada hora, arquivos com data anterior a
  7 dias são apagados.
- Retenção configurável por `PROTECTION_LOG_RETENTION_DAYS` (padrão 7).

### Consulta pelo responsável

- Comando `npm run protection:report` executado no container do backend
  (`docker compose exec backend npm run protection:report`).
- Mostra, por dia, a quantidade de bloqueios e de falhas e os identificadores
  que mais se repetem.

## Alternativas consideradas

- **Tabela no `censo.sqlite`**: fere o modo somente leitura do banco e
  alteraria o arquivo versionado.
- **Outro arquivo SQLite gravável**: funciona, mas exige migrations e
  descarte por consulta para um volume pequeno de eventos.
- **Apenas a saída padrão do container (`docker logs`)**: a rotação do
  Docker é por tamanho, não por data; não garante os 7 dias e mistura com
  outros logs.
- **Endereço de rede em claro**: dado pessoal (LGPD); descartado na
  clarificação da spec 003.
- **Chave do identificador trocada a cada dia**: dificulta ainda mais a
  força bruta, mas impede reconhecer o mesmo acesso em dias diferentes.

## Consequências

- O container do backend passa a ter um volume gravável só para os
  registros.
- Os registros sobrevivem a reinícios do container e são perdidos se o volume
  for removido (`docker compose down -v`).
- O diagnóstico de problemas por endereço de rede deixa de ser possível; é o
  custo aceito da privacidade.
- Escalar para mais de uma instância do backend exigiria armazenamento
  compartilhado (mesma limitação do rate limit em memória, ADR 0017).
