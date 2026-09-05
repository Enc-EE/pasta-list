using Microsoft.EntityFrameworkCore;
using PastaList.Api.Contracts;
using PastaList.Api.Data;
using PastaList.Api.Domain;
using PastaList.Api.Mapping;

namespace PastaList.Api.Endpoints;

public static class ShoppingListEndpoints
{
    public static IEndpointRouteBuilder MapShoppingListEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/lists").WithTags("ShoppingLists");

        group.MapGet("/", GetLists).WithName("GetShoppingLists");
        group.MapGet("/{id:guid}", GetList).WithName("GetShoppingList");
        group.MapPost("/", CreateList).WithName("CreateShoppingList");
        group.MapPut("/{id:guid}", UpdateList).WithName("UpdateShoppingList");
        group.MapDelete("/{id:guid}", DeleteList).WithName("DeleteShoppingList");

        return app;
    }

    private static async Task<IResult> GetLists(
        PastaListDbContext db,
        bool includeArchived = false,
        CancellationToken cancellationToken = default)
    {
        var lists = await db.ShoppingLists
            .AsNoTracking()
            .Where(l => includeArchived || !l.IsArchived)
            .Include(l => l.Items)
            .OrderByDescending(l => l.UpdatedAt)
            .ToListAsync(cancellationToken);

        return Results.Ok(lists.Select(l => l.ToSummaryDto()));
    }

    private static async Task<IResult> GetList(
        Guid id,
        PastaListDbContext db,
        CancellationToken cancellationToken)
    {
        var list = await db.ShoppingLists
            .AsNoTracking()
            .Include(l => l.Items)
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        return list is null ? Results.NotFound() : Results.Ok(list.ToDto());
    }

    private static async Task<IResult> CreateList(
        CreateShoppingListRequest request,
        PastaListDbContext db,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["name"] = ["Name is required."]
            });
        }

        var list = new ShoppingList
        {
            Name = request.Name.Trim(),
            Description = request.Description
        };

        db.ShoppingLists.Add(list);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/lists/{list.Id}", list.ToDto());
    }

    private static async Task<IResult> UpdateList(
        Guid id,
        UpdateShoppingListRequest request,
        PastaListDbContext db,
        CancellationToken cancellationToken)
    {
        var list = await db.ShoppingLists
            .Include(l => l.Items)
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        if (list is null)
        {
            return Results.NotFound();
        }

        list.Name = request.Name.Trim();
        list.Description = request.Description;
        list.IsArchived = request.IsArchived;

        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(list.ToDto());
    }

    private static async Task<IResult> DeleteList(
        Guid id,
        PastaListDbContext db,
        CancellationToken cancellationToken)
    {
        var deleted = await db.ShoppingLists
            .Where(l => l.Id == id)
            .ExecuteDeleteAsync(cancellationToken);

        return deleted == 0 ? Results.NotFound() : Results.NoContent();
    }
}
