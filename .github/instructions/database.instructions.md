---
applyTo: "database/**"
description: Rules for the local PostgreSQL container and schema ownership.
---

# Database instructions

- The schema is owned by **EF Core migrations** in `api/PastaList.Api`.
  `database/` must never contain table DDL. `init/01-init.sql` is limited to
  schema, role and extension creation and only runs on a fresh volume.
- Container name `pastalist-db`, volume `pastalist-data`, image `postgres:17-alpine`.
  Changing any of these means updating `compose.yaml`, `scripts/env.sh` and
  `README.md` in the same change.
- The port is published as `127.0.0.1:5432` on purpose — never bind to `0.0.0.0`.
- Shell scripts start with `#!/usr/bin/env bash` and `set -euo pipefail`,
  source `scripts/env.sh`, and stay idempotent.
- Any script that destroys data must prompt for confirmation first (`db-reset.sh`).
- Credentials here are localhost development values. Never place real secrets in
  this folder; use environment variables for anything else.
- After changing the container setup, verify with `./scripts/db-up.sh` and
  `./scripts/db-psql.sh -c '\dt pasta.*'`.
