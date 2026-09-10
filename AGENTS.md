# AGENTS.md — Pasta List

Guidance for AI coding agents working in this repository. Read this first.

## What this is

**Pasta List** is a shopping list app.

| Folder      | Contents                                                         |
| ----------- | ---------------------------------------------------------------- |
| `web/`      | React 19 + TypeScript + Vite + MUI v9 + Redux Toolkit (RTK Query) |
| `api/`      | ASP.NET Core 9 minimal API + EF Core 9 (Npgsql)                   |
| `database/` | Docs + scripts for the local PostgreSQL Podman container. No app code. |

## Setup

```bash
podman machine start          # macOS only, once per boot
./database/scripts/db-up.sh   # PostgreSQL on localhost:5432
./scripts/dev-certs.sh
cd api/PastaList.Api && dotnet run --launch-profile https # https://localhost:7208
cd web && pnpm install && pnpm dev                         # https://localhost:5173
```

The API applies EF migrations and seeds demo data automatically in Development.

## Verification commands — run these before declaring work done

```bash
cd web  && pnpm lint && pnpm build   # type-check + lint + bundle
cd api  && dotnet build              # must be 0 warnings, 0 errors
cd api  && dotnet test               # API unit tests
cd web  && pnpm test                 # frontend component tests
```

API tests live in `api/PastaList.Api.Tests` (xUnit). Frontend tests use Vitest and
Testing Library under `web/src/**/*.test.tsx`.

## Architecture rules

### API (`api/PastaList.Api`)

- Minimal APIs only. Endpoints live in `Endpoints/*.cs` as static extension methods
  registered from `Program.cs`. Do **not** introduce MVC controllers.
- Layering: `Endpoints` → `Data` (`PastaListDbContext`) → `Domain`.
  Endpoints never return domain entities; map to `Contracts/*Dto` via `Mapping/`.
- EF configuration belongs in `Data/Configurations/`, never in `OnModelCreating` directly.
- Every DB call is `async` and takes a `CancellationToken`. Read-only queries use `AsNoTracking()`.
- Schema is `pasta`, tables are `snake_case`, keys are `Guid`, timestamps are `DateTimeOffset` (UTC).
- Schema changes require a migration: `dotnet ef migrations add <Name> -o Data/Migrations`.
  Never hand-edit an applied migration; add a new one.

### Web (`web`)

- **pnpm only.** Never run `npm` or `yarn` here; `pnpm-lock.yaml` is the single lockfile
  and a `package-lock.json` must never reappear. Add dependencies with `pnpm add <pkg>`.
- Server state lives **only** in RTK Query (`src/features/api/pastaListApi.ts`).
  Never mirror API data into a slice.
- Client/UI state lives in slices under `src/features/<feature>/`. `uiSlice` holds theme,
  filters and snackbar state.
- Always use `useAppDispatch` / `useAppSelector` from `src/app/hooks.ts`.
- MUI **v9**: system props like `alignItems` are no longer accepted directly on `Stack`/`Box`.
  Put them in `sx`. Import icons individually: `import X from '@mui/icons-material/X'`.
- Styling goes through the theme (`src/theme/theme.ts`) and `sx`. No CSS files, no inline `style`.
- Types shared with the API live in `src/types/shoppingList.ts` and must mirror
  `api/PastaList.Api/Contracts/ShoppingListDtos.cs` (camelCase on the wire).
- Development uses HTTPS and the Vite server proxies `/api` to `https://localhost:7208`.
  Production serves the built SPA from the API's `wwwroot`; use relative `/api` URLs.
- The API and SPA are one origin in production. Do not add CORS as a substitute for
  same-origin hosting.
- Authentication uses the `__Host-pastalist.session` HttpOnly cookie. Never put
  session tokens or login codes in frontend state, localStorage, or API responses.
- Login codes are HMAC-hashed, single-use, short-lived, and rate-limited. Production
  requires stable `Auth__CodeHashKey`, SMTP settings, and persistent Data Protection keys.
- Unsafe `/api` requests must pass same-origin/allowed-origin CSRF validation.

### Database (`database/`)

- Contains **no** table DDL. `init/01-init.sql` only creates schema/role/extensions.
- Do not change the container name (`pastalist-db`) or volume (`pastalist-data`)
  without updating `compose.yaml`, `scripts/env.sh` and `README.md` together.

## Conventions

- TypeScript: no `any`, no non-null assertions except the documented `#root` lookup.
- C#: nullable reference types are enabled; do not disable them or use `!` to silence warnings.
- Comments explain *why*, not *what*. Mark deliberate gaps with `// TODO:`.
- Keep changes scoped to the request. Do not reformat or refactor unrelated files.

## Security

- The credentials in `appsettings.Development.json`, `compose.yaml` and `scripts/env.sh`
  are **localhost development only**. Never add real secrets to any tracked file.
- Non-development configuration must come from environment variables
  (e.g. `ConnectionStrings__PastaList`) or a secret store.
- The database port is bound to `127.0.0.1` on purpose. Keep it that way.
- Validate all request input at the endpoint boundary and return `ValidationProblem`.

## Things that will bite you

- Podman must be running (`podman machine start`) before any database script works.
- `Npgsql.EntityFrameworkCore.PostgreSQL` must stay on `9.x`; `10.x` requires .NET 10.
- Auto-migration on startup is Development-only by design.
- pnpm blocks install scripts by default. A package that needs one must be allowed in
  `web/pnpm-workspace.yaml` under `allowBuilds` (this is why `esbuild` is listed).
