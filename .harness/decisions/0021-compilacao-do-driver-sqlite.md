# 0021. Compilação do better-sqlite3 nas imagens Docker

- Status: Aceito
- Data: 2026-09-25
- Revisa: [ADR 0005](0005-docker-compose.md) e [ADR 0006](0006-acesso-a-dados.md)
  (consequência sobre binários pré-compilados)

## Contexto

Os ADRs 0005 e 0006 afirmaram que a imagem `node:24.21.0-slim` usaria
binários pré-compilados do better-sqlite3, sem necessidade de compilar. Na
instalação (tarefa T016 da feature 001), verificou-se que o better-sqlite3
13.0.3 compila o SQLite a partir do código-fonte (`node-gyp rebuild`), o que
exige Python, `make` e `g++`, ausentes na imagem slim. A instalação falhou.

Além disso, o npm 11.19 (incluído no Node.js 24.21.0) bloqueia scripts de
instalação de dependências até que sejam aprovados no `package.json`.

## Decisão

- Um estágio `toolchain` nos Dockerfiles, a partir de `node:24.21.0-slim`,
  instala `python3`, `make` e `g++` pelo gerenciador de pacotes da própria
  imagem. As versões dessas ferramentas seguem a distribuição da imagem, que
  já está fixada pela tag.
- Os estágios `dev` e `build` partem do `toolchain` e compilam o driver.
- A imagem de produção do backend continua sendo `node:24.21.0-slim`, **sem**
  ferramentas de compilação: ela recebe o `node_modules` já compilado de um
  estágio intermediário (`prod-deps`), que roda `npm ci --omit=dev` sobre o
  `toolchain`.
- Scripts de instalação aprovados explicitamente no `package.json`
  (`allowScripts`), com versão fixada: `better-sqlite3` (compilação),
  `esbuild` (binário do Vite), `unrs-resolver` (binário do resolvedor do
  lint) e `vue-demi` (compatibilidade do vue-query).

## Alternativas consideradas

- **Ferramentas de compilação também na imagem de produção**: aumenta tamanho
  e superfície de ataque sem necessidade.
- **`node:sqlite`**: ainda instável no Node.js 24 (ADR 0006).
- **Aprovar todos os scripts de instalação (`--all`)**: aceita scripts de
  qualquer dependência futura sem revisão.

## Consequências

- Imagens de dev e de build maiores; a primeira instalação leva alguns
  minutos a mais pela compilação do SQLite.
- Imagem de produção inalterada em tamanho e conteúdo de sistema.
- Nova dependência com script de instalação exige aprovação explícita
  (`npm install-scripts approve`), revisada no commit.
- O pacote `e2e` também depende do better-sqlite3; a imagem de E2E precisa
  das mesmas ferramentas (tratado na tarefa de E2E da fundação).
