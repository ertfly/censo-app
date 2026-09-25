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
CMD ["npm", "run", "dev", "--workspace", "@censo/frontend"]

FROM manifests AS build
RUN npm ci --workspace @censo/contracts --workspace @censo/frontend
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY frontend frontend
RUN npm run build --workspace @censo/contracts \
    && npm run build --workspace @censo/frontend

FROM nginx:1.30.5-alpine AS prod
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
