# Pasta List

A shopping list app. React frontend, C# API, PostgreSQL.

| Part        | Stack                                                         | Dev URL                |
| ----------- | ------------------------------------------------------------- | ---------------------- |
| `web/`      | React 19, TypeScript, Vite, MUI v9, Redux Toolkit + RTK Query | https://localhost:5173 |
| `api/`      | ASP.NET Core 9 minimal API, EF Core 9, Npgsql                 | https://localhost:7208 |
| `database/` | PostgreSQL 17 in a Podman container (docs + scripts only)     | localhost:5432         |

## Prerequisites

- Node.js 22+
- pnpm 10+ (`corepack enable` then `corepack use pnpm@latest`, or `brew install pnpm`)
- .NET SDK 9
- Podman (on macOS: `podman machine init` once, then `podman machine start`)
- `dotnet tool install --global dotnet-ef`

## Getting started

```bash
# 1. database
podman machine start
./database/scripts/db-up.sh

# 2. api  (applies migrations + seeds demo data in Development)
cd api/PastaList.Api
dotnet run --launch-profile https

# 3. web
cd web
pnpm install
pnpm dev
```

Then open https://localhost:5173. Run `./scripts/dev-certs.sh` once first to create
the trusted certificate used by Vite. The Vite dev server proxies `/api` to the API,
so no CORS setup is needed locally.

In VS Code you can instead run the task **dev: full stack**.

## Verifying a change

```bash
cd api && dotnet build
cd web && pnpm lint && pnpm build
cd api && dotnet test
cd web && pnpm test
```

Or the VS Code task **verify: all** (default build task).

## Hosting shape

Production is a same-origin BFF: the ASP.NET Core app serves the compiled React
application from `wwwroot` and handles `/api/*`. Put the container behind a TLS
terminating reverse proxy for `pasta-list.de`; the proxy enforces HTTPS and forwards
the original scheme using `X-Forwarded-Proto`.

Build the deployable image from the repository root:

```bash
podman build -f Containerfile -t pasta-list:local .
podman run --rm -p 127.0.0.1:8080:8080 \
  -e ConnectionStrings__PastaList='Host=host.containers.internal;Port=5432;Database=pastalist;Username=pastalist;Password=pastalist_dev' \
  pasta-list:local
```

For a production-style app container, copy `.env.production.example` to an
untracked `.env.production`, replace every placeholder, then run:

```bash
podman build -f Containerfile -t pasta-list:latest .
podman compose --env-file .env.production -f compose.production.yaml up -d
```

Put the app service behind the reverse proxy described in
[Caddyfile.example](Caddyfile.example). The app container is intentionally not
published to the public network; the proxy is responsible for TLS and forwards
`X-Forwarded-Proto`.

The production container does not run database migrations automatically. Apply a
reviewed migration bundle or run `./scripts/migrate-production.sh` with
`ConnectionStrings__PastaList` set as a deployment step. Persist ASP.NET Core Data
Protection keys in the compose volume; otherwise container restarts invalidate all
cookie sessions.

For the complete image publishing, secrets, Compose, migration, reverse-proxy,
and verification procedure, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Authentication

Authentication uses a six-digit, single-use email code and an ASP.NET Core cookie.
The code is stored only as an HMAC-SHA256 hash, expires after 10 minutes, and is
burned after five failed attempts. Development writes the code to the API log;
production uses the configured SMTP sender.

The session cookie is `__Host-pastalist.session`: Secure, HttpOnly, SameSite=Lax,
and valid for 14 days with sliding expiration. All list endpoints require it;
`/health` and the login-code request/verification endpoints do not.

For production, configure these environment variables without committing secrets:

```bash
ConnectionStrings__PastaList=...
Auth__CodeHashKey=...       # long random secret, stable across restarts
Email__Host=...
Email__Port=587
Email__User=...
Email__Password=...
Email__From=auth@pasta-list.de
DataProtection__KeysPath=/var/lib/pasta-list/keys
```

The reverse proxy must preserve `X-Forwarded-Proto`, and the Data Protection key
directory must be a persistent volume. Development uses `https://localhost:5173`
as the allowed frontend origin; CSRF-protected mutations reject other origins.

## API surface

| Method   | Route                                       | Purpose             |
| -------- | ------------------------------------------- | ------------------- |
| `GET`    | `/health`                                   | Liveness probe      |
| `POST`   | `/api/auth/request-code`                    | Request login code  |
| `POST`   | `/api/auth/verify`                          | Verify login code   |
| `GET`    | `/api/auth/me`                              | Current session     |
| `POST`   | `/api/auth/logout`                          | End session         |
| `GET`    | `/api/lists?includeArchived=false`          | List summaries      |
| `GET`    | `/api/lists/{id}`                           | One list with items |
| `POST`   | `/api/lists`                                | Create a list       |
| `PUT`    | `/api/lists/{id}`                           | Update a list       |
| `DELETE` | `/api/lists/{id}`                           | Delete a list       |
| `GET`    | `/api/lists/{listId}/members`               | List members        |
| `POST`   | `/api/lists/{listId}/members`               | Invite a member     |
| `PUT`    | `/api/lists/{listId}/members/{userId}`      | Change member role  |
| `DELETE` | `/api/lists/{listId}/members/{userId}`      | Remove a member     |
| `GET`    | `/api/lists/{listId}/items`                 | Items of a list     |
| `POST`   | `/api/lists/{listId}/items`                 | Add an item         |
| `PUT`    | `/api/lists/{listId}/items/{itemId}`        | Update an item      |
| `PATCH`  | `/api/lists/{listId}/items/{itemId}/toggle` | Toggle checked      |
| `DELETE` | `/api/lists/{listId}/items/{itemId}`        | Delete an item      |

OpenAPI document (Development): https://localhost:7208/openapi/v1.json
Ready-made requests: [api/PastaList.Api/PastaList.Api.http](api/PastaList.Api/PastaList.Api.http)

## Project layout

```
api/PastaList.Api/
  Contracts/        DTOs - the public API shape
  Data/             DbContext, entity configurations, migrations, dev seeder
  Domain/           EF entities
  Endpoints/        Minimal API route groups
  Mapping/          Entity -> DTO extensions
database/
  compose.yaml      Podman compose definition
  init/             First-run SQL (schema/role/extensions only)
  scripts/          db-up / db-down / db-psql / db-logs / db-reset
web/src/
  app/              Redux store + typed hooks
  components/       Reusable UI (layout, items, lists)
  features/api/     RTK Query API definition
  features/ui/      UI state slice
  pages/            Routed screens
  theme/            MUI theme
```

## AI / agent support

- [AGENTS.md](AGENTS.md) — architecture rules, setup and verification commands
- [.github/copilot-instructions.md](.github/copilot-instructions.md) — repo-wide Copilot guidance
- [.github/instructions/](.github/instructions) — path-scoped rules for frontend, API and database
- [.github/prompts/](.github/prompts) — reusable prompts for common cross-stack tasks
- [.vscode/mcp.json](.vscode/mcp.json) — optional PostgreSQL MCP server for schema-aware agents

## Security note

All credentials in this repository (`appsettings.Development.json`,
`database/compose.yaml`, `database/scripts/env.sh`) are **local development only**
and the database port is bound to `127.0.0.1`. Real deployments must supply
configuration through environment variables or a secret store.

## Roadmap / TODO

- [ ] Drag & drop reordering of items
- [ ] PostgreSQL-backed integration tests for migrations and authorization queries
- [ ] CI deployment/publish workflow
- [ ] Persist theme preference in `localStorage`

## Custom TODO

- Check SSL Termination hosting strategy
- DB creation and migrations
- verify sharing testing
- generate rtk query
