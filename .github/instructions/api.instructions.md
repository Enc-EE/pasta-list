---
applyTo: "api/**/*.cs"
description: C#, minimal API and EF Core conventions for the Pasta List API.
---

# API instructions

## Structure

- `Domain/` — EF entities. Plain classes, no attributes, no framework references.
- `Data/` — `PastaListDbContext`, `Data/Configurations/` (`IEntityTypeConfiguration<T>`),
  `Data/Migrations/`, `DevelopmentSeeder`.
- `Contracts/` — request/response records. These are the public API shape.
- `Mapping/` — extension methods entity → DTO.
- `Endpoints/` — one static class per resource with a
  `Map<Resource>Endpoints(this IEndpointRouteBuilder)` extension method,
  registered in `Program.cs`.

Do not add MVC controllers, AutoMapper, or a repository layer over `DbContext`.

## Endpoints

- Handlers are `private static async Task<IResult>` methods with explicit parameters;
  do not write large lambdas inline in `MapGroup`.
- Return `Results.Ok`, `Results.Created`, `Results.NoContent`, `Results.NotFound`
  or `Results.ValidationProblem`. Never throw for expected failures.
- Every handler takes a `CancellationToken` and passes it to EF Core.
- Give every route a `.WithName(...)`; group routes with `.WithTags(...)`.
- Validate input at the top of the handler and return `Results.ValidationProblem`
  with camelCase field keys.

## EF Core

- Read-only queries: `AsNoTracking()`.
- Load children explicitly with `Include`; never rely on lazy loading.
- Bulk removals use `ExecuteDeleteAsync`.
- Mapping details (table name, max length, precision, indexes, cascade behaviour)
  belong in `Data/Configurations/`.
- Schema `pasta`; tables and columns `snake_case`; keys `Guid`; timestamps
  `DateTimeOffset` in UTC (maintained centrally by `SaveChangesAsync`).
- Schema change ⇒ `dotnet ef migrations add <Name> -o Data/Migrations`.
  Never edit an already-applied migration.
- Keep `Npgsql.EntityFrameworkCore.PostgreSQL` on `9.x` (10.x needs .NET 10).

## C# style

- File-scoped namespaces, nullable reference types enabled, implicit usings.
- Prefer `record` for DTOs, primary constructors for services and the `DbContext`.
- `var` when the type is obvious from the right-hand side.
- Async all the way; no `.Result` or `.Wait()`.
- The build must stay at 0 warnings.

## Configuration & security

- Read config through `IConfiguration`; fail fast with a clear exception when a
  required value is missing (see the connection string in `Program.cs`).
- Never hard-code secrets. Non-development values come from environment variables
  such as `ConnectionStrings__PastaList`.
- `EnableSensitiveDataLogging`, auto-migration and seeding stay Development-only.
- CORS origins are configured, never `AllowAnyOrigin`.
