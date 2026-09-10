using Microsoft.EntityFrameworkCore;
using PastaList.Api.Contracts;
using PastaList.Api.Data;
using PastaList.Api.Domain;
using PastaList.Api.Mapping;
using PastaList.Api.Services;

namespace PastaList.Api.Endpoints;

public static class ShoppingListItemEndpoints
{
    public static IEndpointRouteBuilder MapShoppingListItemEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/lists/{listId:guid}/items")
            .WithTags("ShoppingListItems")
            .RequireAuthorization();

        group.MapGet("/", GetItems).WithName("GetShoppingListItems");
        group.MapPost("/", CreateItem).WithName("CreateShoppingListItem");
        group.MapPut("/{itemId:guid}", UpdateItem).WithName("UpdateShoppingListItem");
        group.MapPatch("/{itemId:guid}/toggle", ToggleItem).WithName("ToggleShoppingListItem");
        group.MapDelete("/{itemId:guid}", DeleteItem).WithName("DeleteShoppingListItem");

        return app;
    }

    private static IResult? RequireMember(ShoppingListRole? role) =>
        role is null ? Results.NotFound() : null;

    private static IResult? RequireEditor(ShoppingListRole? role)
    {
        if (role is null)
        {
            return Results.NotFound();
        }

        return role == ShoppingListRole.Viewer
            ? Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Viewers cannot modify this list.")
            : null;
    }

    private static async Task<IResult> GetItems(
        Guid listId,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var role = await db.GetMemberRoleAsync(listId, currentUser.Id!.Value, cancellationToken);
        if (RequireMember(role) is { } denied)
        {
            return denied;
        }

        var items = await db.ShoppingListItems
            .AsNoTracking()
            .Where(i => i.ShoppingListId == listId)
            .OrderBy(i => i.SortOrder)
            .ToListAsync(cancellationToken);

        return Results.Ok(items.Select(i => i.ToDto()));
    }

    private static async Task<IResult> CreateItem(
        Guid listId,
        CreateShoppingListItemRequest request,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var role = await db.GetMemberRoleAsync(listId, currentUser.Id!.Value, cancellationToken);
        if (RequireEditor(role) is { } denied)
        {
            return denied;
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["name"] = ["Name is required."]
            });
        }

        var nextSortOrder = await db.ShoppingListItems
            .Where(i => i.ShoppingListId == listId)
            .Select(i => (int?)i.SortOrder)
            .MaxAsync(cancellationToken) ?? -1;

        var item = new ShoppingListItem
        {
            ShoppingListId = listId,
            Name = request.Name.Trim(),
            Quantity = request.Quantity <= 0 ? 1 : request.Quantity,
            Unit = request.Unit,
            Category = request.Category,
            Note = request.Note,
            SortOrder = nextSortOrder + 1
        };

        db.ShoppingListItems.Add(item);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/lists/{listId}/items/{item.Id}", item.ToDto());
    }

    private static async Task<IResult> UpdateItem(
        Guid listId,
        Guid itemId,
        UpdateShoppingListItemRequest request,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var role = await db.GetMemberRoleAsync(listId, currentUser.Id!.Value, cancellationToken);
        if (RequireEditor(role) is { } denied)
        {
            return denied;
        }

        var item = await db.ShoppingListItems
            .FirstOrDefaultAsync(i => i.Id == itemId && i.ShoppingListId == listId, cancellationToken);

        if (item is null)
        {
            return Results.NotFound();
        }

        item.Name = request.Name.Trim();
        item.Quantity = request.Quantity;
        item.Unit = request.Unit;
        item.Category = request.Category;
        item.Note = request.Note;
        item.IsChecked = request.IsChecked;
        item.SortOrder = request.SortOrder;

        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(item.ToDto());
    }

    private static async Task<IResult> ToggleItem(
        Guid listId,
        Guid itemId,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var role = await db.GetMemberRoleAsync(listId, currentUser.Id!.Value, cancellationToken);
        if (RequireEditor(role) is { } denied)
        {
            return denied;
        }

        var item = await db.ShoppingListItems
            .FirstOrDefaultAsync(i => i.Id == itemId && i.ShoppingListId == listId, cancellationToken);

        if (item is null)
        {
            return Results.NotFound();
        }

        item.IsChecked = !item.IsChecked;
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(item.ToDto());
    }

    private static async Task<IResult> DeleteItem(
        Guid listId,
        Guid itemId,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var role = await db.GetMemberRoleAsync(listId, currentUser.Id!.Value, cancellationToken);
        if (RequireEditor(role) is { } denied)
        {
            return denied;
        }

        var deleted = await db.ShoppingListItems
            .Where(i => i.Id == itemId && i.ShoppingListId == listId)
            .ExecuteDeleteAsync(cancellationToken);

        return deleted == 0 ? Results.NotFound() : Results.NoContent();
    }
}
