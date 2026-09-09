#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="${ROOT_DIR}/web/certs"
CERT_PATH="${CERT_DIR}/localhost.pfx"
CERT_PASSWORD="pasta-list-local-dev"

mkdir -p "${CERT_DIR}"
dotnet dev-certs https --trust
dotnet dev-certs https --export-path "${CERT_PATH}" --format Pfx --password "${CERT_PASSWORD}"

cat <<EOF
Local HTTPS certificate exported to ${CERT_PATH}.
The Vite dev server reads this local-only certificate through VITE_HTTPS_CERT_PASSWORD.
EOF
