#!/usr/bin/env bash
# Copia o banco para os testes E2E: nenhum teste usa o censo.sqlite versionado
# (Princípio V, ADR 0020).
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p e2e/.tmp
cp censo.sqlite e2e/.tmp/censo.sqlite
echo "Banco copiado para e2e/.tmp/censo.sqlite"
