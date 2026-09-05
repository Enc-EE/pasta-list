## What changed

<!-- One or two sentences. Link the issue if there is one. -->

## Checklist

- [ ] `cd api && dotnet build` — 0 warnings, 0 errors
- [ ] `cd web && pnpm lint && pnpm build` — clean
- [ ] Schema changes include an EF migration (`api/PastaList.Api/Data/Migrations`)
- [ ] API changes are reflected in `Contracts/`, `web/src/types/shoppingList.ts` and `PastaList.Api.http`
- [ ] No secrets or non-local credentials added
- [ ] Diff is scoped to the change; no unrelated reformatting
