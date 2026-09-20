# Publishing Pasta List

This repository produces one production image. It contains the ASP.NET Core API
and the built React application, so deploy the same image for both the UI and
`/api/*`.

## Prerequisites

- PostgreSQL database
- SMTP account
- TLS-terminating reverse proxy that forwards `X-Forwarded-Proto`
- Podman and Podman Compose

## Build and publish the image

```bash
export IMAGE=registry.example.com/your-org/pasta-list:2026.09.20
podman build --file Containerfile --tag "$IMAGE" .
podman push "$IMAGE"
```

Use a new tag for each release. Do not rely on a mutable tag such as `latest`:
it makes rollback and verification ambiguous.

## Configure the deployment host

Copy the tracked template to a deployment-only secrets file. The example file is
safe to commit; `.env.production` must remain untracked.

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

## Deploy with Compose

Run these commands from the repository root on the deployment host:

```bash
podman login registry.example.com
podman compose --env-file .env.production -f compose.production.yaml pull
podman compose --env-file .env.production -f compose.production.yaml up -d
podman compose --env-file .env.production -f compose.production.yaml ps
```

`compose.production.yaml` intentionally exposes port `8080` only to its Compose
network. It does not publish a host port, so the application cannot be reached
directly from the internet. It also restarts the app after a host reboot or
process failure and persists data-protection keys in the `pastalist-keys` volume.

To upgrade, change only `PASTA_LIST_IMAGE` to the new immutable tag, then run
the `pull` and `up -d` commands again. To roll back, restore the previous tag and
repeat those commands. Inspect failures with:

```bash
podman compose --env-file .env.production -f compose.production.yaml logs --tail=100 app
```

## Database migration

The production container deliberately does not apply EF migrations at startup.
Before deploying a version with schema changes, run the reviewed migration step
against the production database from a trusted machine:

```bash
export ConnectionStrings__PastaList='Host=...;Database=...;Username=...;Password=...'
./scripts/migrate-production.sh
```

Back up the database first. Run a migration before or alongside the application
deployment only when that migration is compatible with both application versions.

## Reverse proxy and TLS

The application must be behind HTTPS because its authentication cookie is
secure. The proxy must forward `X-Forwarded-Proto`; without it, the app cannot
correctly identify the original HTTPS request.

`Caddyfile.example` has a Caddy configuration that proxies to `app:8080`. That
name resolves only when Caddy joins the same Compose network as the `app`
service. Either add Caddy to `compose.production.yaml`, or connect an existing
Caddy container to the Compose project's default network and use `app:8080` as
its upstream. When Caddy runs directly on the host instead, publish a loopback
port for the app and proxy to `127.0.0.1:<port>`; do not publish it on all host
interfaces.

After DNS and TLS are configured, verify the public deployment:

```bash
curl --fail --location https://pasta-list.example/health
```

The expected response is HTTP `200`. Also request a login code and complete a
login to verify SMTP, cookies, and proxy forwarding end to end.
