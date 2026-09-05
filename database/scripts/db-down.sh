#!/usr/bin/env bash
# Stop the database container. The data volume is kept.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

podman stop "${CONTAINER_NAME}"
