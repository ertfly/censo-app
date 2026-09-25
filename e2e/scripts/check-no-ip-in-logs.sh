#!/usr/bin/env bash
# Nenhum log do backend ou do nginx contém endereço de rede (spec 003 FR-019,
# ADR 0019). Uso: check-no-ip-in-logs.sh <arquivos de log...>
set -euo pipefail

ipv4='\b([0-9]{1,3}\.){3}[0-9]{1,3}\b'
# Pelo menos 4 grupos, para não confundir com horários (16:13:26).
ipv6='\b([0-9a-fA-F]{1,4}:){3,7}[0-9a-fA-F]{1,4}\b|::ffff:'

found=0
for file in "$@"; do
    if grep -Eq "$ipv4|$ipv6" "$file"; then
        echo "Endereço de rede encontrado em $file:"
        grep -En "$ipv4|$ipv6" "$file" | head -5
        found=1
    fi
done
[ "$found" -eq 0 ] && echo "Nenhum endereço de rede nos logs"
exit "$found"
