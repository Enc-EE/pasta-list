#!/usr/bin/env bash
# Follow the database container logs.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

podman logs -f "${CONTAINER_NAME}"
