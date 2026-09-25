# Contexto de build: raiz do repositório (ADR 0013).

FROM node:24.21.0-slim AS manifests
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY e2e/package.json e2e/

# Desenvolvimento: o código é montado pelo compose.dev.yaml.
FROM manifests AS dev
CMD ["npm", "run", "dev", "--workspace", "@censo/backend"]

FROM manifests AS build
RUN npm ci --workspace @censo/contracts --workspace @censo/backend
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY backend backend
RUN npm run build --workspace @censo/contracts \
    && npm run build --workspace @censo/backend

FROM manifests AS prod
ENV NODE_ENV=production
RUN npm ci --omit=dev --workspace @censo/contracts --workspace @censo/backend \
    && npm cache clean --force
COPY --from=build /app/packages/contracts/dist packages/contracts/dist
COPY --from=build /app/backend/dist backend/dist
USER node
WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "dist/main.js"]
