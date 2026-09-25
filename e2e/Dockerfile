# Imagem dos testes E2E: Playwright + ferramentas para compilar o better-sqlite3
# (ADR 0020, ADR 0021). Os testes são montados pelo compose, não copiados.
FROM mcr.microsoft.com/playwright:v1.63.0-noble
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY e2e/package.json e2e/
RUN npm ci --workspace @censo/e2e
WORKDIR /app/e2e
