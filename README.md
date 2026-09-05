# Pasta List

A shopping list app. React frontend, C# API, PostgreSQL.

| Part       | Stack                                                              | Dev URL                 |
| ---------- | ------------------------------------------------------------------ | ----------------------- |
| `web/`     | React 19, TypeScript, Vite, MUI v9, Redux Toolkit + RTK Query       | http://localhost:5173   |
| `api/`     | ASP.NET Core 9 minimal API, EF Core 9, Npgsql                       | http://localhost:5192   |
| `database/`| PostgreSQL 17 in a Podman container (docs + scripts only)           | localhost:5432          |

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
dotnet run --launch-profile http

# 3. web
cd web
pnpm install
pnpm dev
```

Then open http://localhost:5173. The Vite dev server proxies `/api` to the API,
so no CORS setup is needed locally.

In VS Code you can instead run the task **dev: full stack**.

## Verifying a change

```bash
cd api && dotnet build
cd web && pnpm lint && pnpm build
```

Or the VS Code task **verify: all** (default build task).

## API surface

| Method   | Route                                     | Purpose               |
| -------- | ----------------------------------------- | --------------------- |
| `GET`    | `/health`                                 | Liveness probe        |
| `GET`    | `/api/lists?includeArchived=false`        | List summaries        |
| `GET`    | `/api/lists/{id}`                         | One list with items   |
| `POST`   | `/api/lists`                              | Create a list         |
| `PUT`    | `/api/lists/{id}`                         | Update a list         |
| `DELETE` | `/api/lists/{id}`                         | Delete a list         |
| `GET`    | `/api/lists/{listId}/items`               | Items of a list       |
| `POST`   | `/api/lists/{listId}/items`               | Add an item           |
| `PUT`    | `/api/lists/{listId}/items/{itemId}`      | Update an item        |
| `PATCH`  | `/api/lists/{listId}/items/{itemId}/toggle` | Toggle checked      |
| `DELETE` | `/api/lists/{listId}/items/{itemId}`      | Delete an item        |

OpenAPI document (Development): http://localhost:5192/openapi/v1.json
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

- [ ] Authentication and per-user lists (`ShoppingList.OwnerId`)
- [ ] Drag & drop reordering of items
- [ ] Tests: xUnit for the API, Vitest + Testing Library for the web app
- [ ] CI workflow running both verification commands
- [ ] Persist theme preference in `localStorage`
