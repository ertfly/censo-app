# 0005. Execução com Docker Compose: produção e desenvolvimento

- Status: Aceito
- Data: 2026-09-25

## Contexto

A aplicação inteira precisa subir em uma máquina que tenha apenas Docker
instalado, com um único comando que levante backend
([ADR 0002](0002-runtime-e-backend.md)) e frontend
([ADR 0003](0003-frontend-vue.md)). São necessários dois modos:

- **Produção:** faz o build da aplicação e roda o resultado.
- **Desenvolvimento:** roda `npm run dev` com recarga automática.

## Decisão

### Arquivos

| Arquivo | Modo | Comando |
|---|---|---|
| `compose.yaml` | Produção | `docker compose up` |
| `compose.dev.yaml` | Desenvolvimento | `docker compose -f compose.dev.yaml up` |

O modo de produção é o padrão porque é o que roda na máquina que só tem
Docker.

### Estrutura

```
censo-app/
├── compose.yaml
├── compose.dev.yaml
├── backend/
│   └── Dockerfile      # estágios: dev, build, prod
├── frontend/
│   ├── Dockerfile      # estágios: dev, build, prod
│   └── nginx.conf
└── data/censo.sqlite
```

### Produção (`compose.yaml`)

| Serviço | Imagem base | Como roda |
|---|---|---|
| `backend` | `node:24.21.0-slim` | Build multi-stage: compila o TypeScript e roda `node` sobre o resultado, só com dependências de produção |
| `frontend` | build em `node:24.21.0-slim`, serve em `nginx:1.30.5-alpine` | `vite build` gera arquivos estáticos; o nginx os serve e faz proxy de `/api` para o backend |

- Só o nginx publica porta no host. O backend fica apenas na rede interna do
  Compose.
- Frontend e API na mesma origem (via proxy do nginx): sem CORS.
- `data/` montado como volume no backend; as escritas persistem em
  `data/censo.sqlite`.
- O frontend só sobe depois que o backend responde ao healthcheck.
- `restart: unless-stopped` nos dois serviços.

### Desenvolvimento (`compose.dev.yaml`)

| Serviço | Como roda |
|---|---|
| `backend` | `npm run dev` com recarga automática; código montado do host |
| `frontend` | `npm run dev` (Vite com HMR, escutando em `0.0.0.0`); proxy de `/api` para o backend configurado no Vite |

- `npm install` roda dentro do container; `node_modules` fica em volume
  nomeado, sem depender de Node no host.
- Backend e frontend publicam suas portas no host para depuração.

### Versões

Imagens fixadas por versão exata e estável: Node.js 24.21.0 (LTS) e nginx
1.30.5 (linha stable). Atualizar exige alterar a tag e registrar em
`stack.md`.

### Portas

Configuráveis por variável de ambiente, com padrões definidos na montagem do
projeto e documentados no README.

## Alternativas consideradas

- **`compose.yaml` + `compose.override.yaml` para desenvolvimento:** o override
  é carregado automaticamente, então `docker compose up` subiria o modo de
  desenvolvimento, contrariando o uso na máquina de produção.
- **Backend servindo os arquivos do frontend:** um container a menos, mas
  mistura responsabilidades e perde o nginx para arquivos estáticos.
- **Imagens Alpine para o Node:** menores, mas usam musl; dependências nativas
  (possível driver SQLite) podem exigir compilação. `slim` (Debian) evita
  isso.
- **Tags flutuantes (`node:24-slim`, `nginx:stable-alpine`):** o build mudaria
  sem alteração no repositório.

## Consequências

- Nenhuma ferramenta além do Docker é necessária para rodar ou desenvolver.
- **Git LFS:** clonar sem `git-lfs` baixa um ponteiro de texto no lugar de
  `data/censo.sqlite`. O backend deve validar na inicialização que o arquivo é
  um SQLite válido e falhar com mensagem explicando como obter o arquivo.
- Como o banco é montado do host, o uso da aplicação altera o arquivo
  versionado (ver [ADR 0001](0001-banco-de-dados-sqlite.md)).
- O modo WAL (proposto em `database.md`) em volume montado deve ser validado
  na montagem do projeto, principalmente em Docker Desktop.
- A organização interna de `backend/` e `frontend/` (workspaces, tipos
  compartilhados) fica para ADR próprio.
