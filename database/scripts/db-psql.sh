#!/usr/bin/env bash
# Open an interactive psql shell inside the database container.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

podman exec -it "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" "$@"
