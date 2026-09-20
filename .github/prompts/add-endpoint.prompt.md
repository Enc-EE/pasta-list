---
agent: agent
description: Add a new REST endpoint to the Pasta List API and wire it into the frontend.
---

Add the endpoint `${input:method} ${input:route}` to the Pasta List API.

1. Define request/response records in `api/PastaList.Api/Contracts/`.
   Never expose EF entities.
2. Add a `private static async Task<IResult>` handler in the matching class under
   `api/PastaList.Api/Endpoints/`, registered on the existing `MapGroup` with
   `.WithName(...)`. Take a `CancellationToken` and pass it to EF Core.
3. Validate input and return `Results.ValidationProblem` / `Results.NotFound`
   instead of throwing.
4. Add an example request to `api/PastaList.Api/PastaList.Api.http`.
5. Add the RTK Query endpoint in `web/src/features/api/pastaListApi.ts` with correct
   `providesTags` / `invalidatesTags`, export the hook, and mirror the types in
   `web/src/types/shoppingList.ts`.
6. Verify with `dotnet build` and `npm run lint && npm run build`.
