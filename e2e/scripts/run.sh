#!/usr/bin/env bash
# Roda os testes E2E nas duas stacks do ADR 0020, com a proteção sempre ligada:
# suíte geral (compose.e2e.yaml) e limite/expiração (compose.e2e-protection.yaml).
# Depois confere, pelo host, o relatório de proteção e a ausência de IP nos logs.
set -euo pipefail
cd "$(dirname "$0")/../.."

./e2e/scripts/prepare-database.sh
export DATABASE_FILE=./e2e/.tmp/censo.sqlite

run_stack() {
    local project=$1 file=$2 playwright_project=$3
    local compose=(docker compose -p "$project" -f compose.yaml -f "$file")
    "${compose[@]}" up -d --build --wait frontend
    local status=0
    "${compose[@]}" run --rm --build e2e npx playwright test --project="$playwright_project" --pass-with-no-tests || status=$?
    if [ "$playwright_project" = protection ] && [ "$status" -eq 0 ]; then
        ./e2e/scripts/check-protection-report.sh "$project" -f compose.yaml -f "$file" || status=$?
    fi
    "${compose[@]}" logs --no-color --no-log-prefix backend frontend > "e2e/.tmp/logs-$project.txt"
    "${compose[@]}" down --volumes
    return "$status"
}

run_stack censo-app-e2e compose.e2e.yaml general
run_stack censo-app-e2e-protection compose.e2e-protection.yaml protection
./e2e/scripts/check-no-ip-in-logs.sh e2e/.tmp/logs-censo-app-e2e.txt e2e/.tmp/logs-censo-app-e2e-protection.txt
