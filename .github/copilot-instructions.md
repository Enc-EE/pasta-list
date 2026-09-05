# Copilot instructions — Pasta List

Pasta List is a shopping list app: React + MUI + Redux Toolkit in `web/`,
ASP.NET Core minimal API + EF Core in `api/`, PostgreSQL in a Podman container
documented in `database/`.

**Read [AGENTS.md](../AGENTS.md) for the full architecture rules, setup steps and
verification commands. It is the source of truth; this file only summarises it.**

## Non-negotiables

- Verify every change: `cd web && npm run lint && npm run build` and `cd api && dotnet build`.
- Server state belongs in RTK Query, UI state in a Redux slice. Never duplicate.
- API endpoints return DTOs from `Contracts/`, never EF entities.
- Schema changes need an EF migration; `database/` holds no table DDL.
- MUI v9: system props such as `alignItems` go into `sx`, not directly on the component.
- Never commit real secrets. Local dev credentials are localhost-only.
- Keep diffs minimal and scoped; do not reformat unrelated code.
