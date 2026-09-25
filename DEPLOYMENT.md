## Deployment Steps

### DB

1. `APP_USER=pastalistdbuser`
1. Create user pastalistdbuser (useradd, subuid, subgid)
1. Create directory /projects/pasta-list-db
1. curl database/compose.db.production.yaml -> compose.yaml
1. check owner and permissions
1. set secrets

   ```
   read -rsp 'Secret: ' S; printf '%s' "$S" | sudo -u $APP_USER podman secret create db_password -; unset S
   ```

1. start
   ```
   sudo -u $APP_USER podman-compose -f compose.yaml up -d
   ```

### App

1. `APP_USER=pastalistuser`
1. Create user pastalistdbuser (useradd, subuid, subgid)
1. Create directory /projects/pasta-list
1. curl compose.production.yaml -> compose.yaml
1. create .env.production
1. check owner and permissions
1. set secrets

   ```
   read -rsp 'Secret: ' S; printf '%s' "$S" | sudo -u $APP_USER podman secret create connection_string -; unset S
   read -rsp 'Secret: ' S; printf '%s' "$S" | sudo -u $APP_USER podman secret create code_hash_key -; unset S
   read -rsp 'Secret: ' S; printf '%s' "$S" | sudo -u $APP_USER podman secret create email_password -; unset S
   ```

1. start
   ```
   sudo -u $APP_USER podman-compose --env-file .env.production -f compose.yaml up -d
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
