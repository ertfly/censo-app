# Contexto de build: raiz do repositório (ADR 0013).

FROM node:24.21.0-slim AS manifests
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY e2e/package.json e2e/

# Ferramentas para compilar o better-sqlite3 (ADR 0021).
FROM manifests AS toolchain
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Desenvolvimento: o código é montado pelo compose.dev.yaml.
FROM toolchain AS dev
# Pastas de node_modules criadas como usuário node: os volumes nomeados herdam o dono,
# e os arquivos gravados no repositório montado ficam com o UID do host (1000).
RUN mkdir -p node_modules packages/contracts/node_modules backend/node_modules \
    frontend/node_modules e2e/node_modules \
    && chown -R node:node /app
USER node
CMD ["npm", "run", "dev", "--workspace", "@censo/backend"]

FROM toolchain AS build
RUN npm ci --workspace @censo/contracts --workspace @censo/backend
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY backend backend
RUN npm run build --workspace @censo/contracts \
    && npm run build --workspace @censo/backend

# Dependências de produção compiladas aqui, onde há ferramentas de compilação.
FROM toolchain AS prod-deps
RUN npm ci --omit=dev --workspace @censo/contracts --workspace @censo/backend \
    && npm cache clean --force

# Produção: imagem slim, sem ferramentas de compilação.
FROM node:24.21.0-slim AS prod
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app /app
COPY --from=build /app/packages/contracts/dist packages/contracts/dist
COPY --from=build /app/backend/dist backend/dist
USER node
WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "dist/main.js"]
