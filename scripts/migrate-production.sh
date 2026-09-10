#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="${ROOT_DIR}/api/PastaList.Api/PastaList.Api.csproj"

if [[ -z "${ConnectionStrings__PastaList:-}" ]]; then
  echo "ConnectionStrings__PastaList must be set." >&2
  exit 1
fi

dotnet ef database update --project "${PROJECT}"
