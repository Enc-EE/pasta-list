---
agent: agent
description: Add a new field to a Pasta List entity end to end.
---

Add the field `${input:fieldName}` to `${input:entity}` across the whole stack.

Work through these steps in order and do not skip any:

1. **Domain** — add the property to `api/PastaList.Api/Domain/${input:entity}.cs`
   with a sensible default and nullability.
2. **Configuration** — add mapping rules (max length, precision, index) in
   `api/PastaList.Api/Data/Configurations/`.
3. **Migration** — run `dotnet ef migrations add Add${input:fieldName}To${input:entity} -o Data/Migrations`
   in `api/PastaList.Api` and review the generated SQL.
4. **Contracts** — extend the relevant DTOs and request records in
   `api/PastaList.Api/Contracts/ShoppingListDtos.cs`.
5. **Mapping** — update `api/PastaList.Api/Mapping/ShoppingListMappings.cs`.
6. **Endpoints** — accept and persist the new value; validate it if it can be invalid.
7. **Frontend types** — mirror the change in `web/src/types/shoppingList.ts` (camelCase).
8. **Frontend UI** — surface the field where it belongs (form input and/or display).
9. **Verify** — `cd api && dotnet build` and `cd web && npm run lint && npm run build`.

Report which files changed and anything you deliberately left as a TODO.
