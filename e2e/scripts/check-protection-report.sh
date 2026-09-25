#!/usr/bin/env bash
# Confere o relatório de proteção na stack de proteção, ainda no ar (spec 003
# FR-018, quickstart cenário 12). Uso: check-protection-report.sh <projeto> <compose...>
set -euo pipefail
project=$1
shift
compose=(docker compose -p "$project" "$@")

# O bloqueio e a falha de verificação são provocados pelo teste de limite
# (e2e/tests/protection/rate-limit.spec.ts).
report=$("${compose[@]}" exec -T backend npm run --silent protection:report)
echo "$report"

grep -q 'Rate limit blocks: [1-9]' <<<"$report" || { echo "Relatório sem bloqueio"; exit 1; }
grep -q 'invalid [1-9]' <<<"$report" || { echo "Relatório sem falha de verificação"; exit 1; }
if grep -Eq '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' <<<"$report"; then
    echo "Relatório com endereço de rede"
    exit 1
fi
echo "Relatório de proteção conferido"
