#!/usr/bin/env bash
# Start the local PostgreSQL container. Safe to run repeatedly.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

if podman container exists "${CONTAINER_NAME}"; then
  podman start "${CONTAINER_NAME}" >/dev/null
  echo "Started existing container '${CONTAINER_NAME}'."
else
  podman volume exists "${VOLUME_NAME}" || podman volume create "${VOLUME_NAME}" >/dev/null

  podman run -d \
    --name "${CONTAINER_NAME}" \
    -e POSTGRES_DB="${DB_NAME}" \
    -e POSTGRES_USER="${DB_USER}" \
    -e POSTGRES_PASSWORD="${DB_PASSWORD}" \
    -e PGDATA=/var/lib/postgresql/data/pgdata \
    -p "127.0.0.1:${DB_PORT}:5432" \
    -v "${VOLUME_NAME}:/var/lib/postgresql/data" \
    -v "${INIT_DIR}:/docker-entrypoint-initdb.d:ro,z" \
    --health-cmd "pg_isready -U ${DB_USER} -d ${DB_NAME}" \
    --health-interval 5s \
    "${IMAGE}" >/dev/null
  echo "Created container '${CONTAINER_NAME}'."
fi

printf 'Waiting for PostgreSQL'
for _ in $(seq 1 30); do
  if podman exec "${CONTAINER_NAME}" pg_isready -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; then
    echo " - ready on localhost:${DB_PORT}"
    exit 0
  fi
  printf '.'
  sleep 1
done

echo
echo "Database did not become ready in time. Check: podman logs ${CONTAINER_NAME}" >&2
exit 1
