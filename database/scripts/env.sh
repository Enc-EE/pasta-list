#!/usr/bin/env bash
# Shared settings for the local Pasta List database container.
set -euo pipefail

CONTAINER_NAME="pastalist-db"
VOLUME_NAME="pastalist-data"
IMAGE="docker.io/library/postgres:17-alpine"
DB_NAME="pastalist"
DB_USER="pastalist"
# Local development password only.
DB_PASSWORD="pastalist_dev"
DB_PORT="5432"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INIT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)/init"
