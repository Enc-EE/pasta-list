#!/usr/bin/env bash
# DESTRUCTIVE: removes the container AND the data volume, then recreates both.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

read -r -p "This deletes all local Pasta List data. Continue? [y/N] " answer
if [[ "${answer}" != "y" && "${answer}" != "Y" ]]; then
  echo "Aborted."
  exit 1
fi

podman rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
podman volume rm -f "${VOLUME_NAME}" >/dev/null 2>&1 || true

"$(dirname "${BASH_SOURCE[0]}")/db-up.sh"

echo "Run 'dotnet ef database update' in api/PastaList.Api to recreate the schema."
