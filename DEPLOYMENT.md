## Deployment Steps

### DB

1. `APP_USER=pastalistuser`
1. Create user pastalistuser (useradd, subuid, subgid), if not already created
   for the app below
1. Create directory /projects/pasta-list-db
1. curl database/compose.db.production.yaml -> compose.production.yaml
1. check owner and permissions
1. create the shared network joining the db and app containers (once per
   server; skip if it already exists)
   ```
   sudo -u $APP_USER podman network create pastalist-net
   ```
1. set secrets

   ```
   read -rsp 'Secret: ' S; printf '%s' "$S" | sudo -u $APP_USER podman secret create db_password -; unset S
   ```

1. start
   ```
   sudo -u $APP_USER podman-compose -f compose.db.production.yaml up -d
   ```

### App

1. `APP_USER=pastalistuser`
1. Create directory /projects/pasta-list
1. curl compose.production.yaml
1. create .env.production
1. check owner and permissions
1. set secrets

   ```bash
   # Host=db;Port=5432;Database=pastalist;Username=pastalist;Password=replace
   # "db" is the network alias the db compose file registers on the shared
   # pastalist-net network; both projects run under the same rootless user so
   # they can join it.
   read -rsp 'Secret: ' S; printf '%s' "$S" | sudo -u $APP_USER podman secret create connection_string -; unset S
   read -rsp 'Secret: ' S; printf '%s' "$S" | sudo -u $APP_USER podman secret create code_hash_key -; unset S
   read -rsp 'Secret: ' S; printf '%s' "$S" | sudo -u $APP_USER podman secret create email_password -; unset S
   ```

1. migrate db
   ```
   sudo -u $APP_USER podman-compose --env-file .env.production -f compose.production.yaml run --rm app --migrate-only
   ```
1. start
   ```
   sudo -u $APP_USER podman-compose --env-file .env.production -f compose.production.yaml up -d
   ```

## Misc

- openssl rand -base64 48

## Database migration

The production web process deliberately does not apply EF migrations at startup.
Before starting a version with schema changes, run its container image once in
migration-only mode:

```bash
sudo -u $APP_USER podman-compose --env-file .env.production -f compose.yaml pull app
sudo -u $APP_USER podman-compose --env-file .env.production -f compose.yaml run --rm app --migrate-only
sudo -u $APP_USER podman-compose --env-file .env.production -f compose.yaml up -d
```

The one-shot container uses the same image and secrets as the application and exits
without opening an HTTP port. A migration failure returns a non-zero exit code, so do
not start the new application version when this command fails. Back up the database
first. Run a migration before or alongside the application deployment only when that
migration is compatible with both application versions.

## Reverse proxy and TLS

The application must be behind HTTPS because its authentication cookie is
secure. The proxy must forward `X-Forwarded-Proto`; without it, the app cannot
correctly identify the original HTTPS request.

`Caddyfile.example` proxies to `127.0.0.1:31002`, the app's host-published
port. Either run Caddy directly on the host, or connect an existing Caddy
container to the `pastalist-net` network (`podman network connect
pastalist-net <caddy-container>`) and proxy to `app:8080` instead. Do not
publish the app's port on all host interfaces.

After DNS and TLS are configured, verify the public deployment:

```bash
curl --fail --location https://pasta-list.example/health
```

The expected response is HTTP `200`. Also request a login code and complete a
login to verify SMTP, cookies, and proxy forwarding end to end.
