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
        group.MapPatch("/{itemId:guid}/position", UpdateItemPosition).WithName("UpdateShoppingListItemPosition");
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
            .ThenBy(i => i.Id)
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

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        await db.LockForItemOrderingAsync(listId, cancellationToken);

        var lastSortOrder = await db.ShoppingListItems
            .Where(i => i.ShoppingListId == listId)
            .Select(i => (int?)i.SortOrder)
            .MaxAsync(cancellationToken);

        if (!ShoppingListItemOrdering.TryGetSortOrder(lastSortOrder, null, out var nextSortOrder))
        {
            var existingItems = await db.ShoppingListItems
                .Where(i => i.ShoppingListId == listId)
                .OrderBy(i => i.SortOrder)
                .ThenBy(i => i.Id)
                .ToListAsync(cancellationToken);
            ShoppingListItemOrdering.Normalize(existingItems);
            nextSortOrder = checked((existingItems.Count + 1) * ShoppingListItemOrdering.SortOrderGap);
        }

        var item = new ShoppingListItem
        {
            ShoppingListId = listId,
            Name = request.Name.Trim(),
            Quantity = request.Quantity <= 0 ? 1 : request.Quantity,
            Unit = request.Unit,
            Category = request.Category,
            Note = request.Note,
            SortOrder = nextSortOrder
        };

        db.ShoppingListItems.Add(item);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

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

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["name"] = ["Name is required."]
            });
        }

        var item = await db.ShoppingListItems
            .FirstOrDefaultAsync(i => i.Id == itemId && i.ShoppingListId == listId, cancellationToken);

        if (item is null)
        {
            return Results.NotFound();
        }

        item.Name = request.Name.Trim();
        item.Quantity = request.Quantity <= 0 ? 1 : request.Quantity;
        item.Unit = request.Unit;
        item.Category = request.Category;
        item.Note = request.Note;
        item.IsChecked = request.IsChecked;

        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(item.ToDto());
    }

    private static async Task<IResult> UpdateItemPosition(
        Guid listId,
        Guid itemId,
        UpdateShoppingListItemPositionRequest request,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var role = await db.GetMemberRoleAsync(listId, currentUser.Id!.Value, cancellationToken);
        if (RequireEditor(role) is { } denied)
        {
            return denied;
        }

        var validationErrors = new Dictionary<string, string[]>();
        if (request.PreviousItemId == itemId)
        {
            validationErrors["previousItemId"] = ["The moved item cannot be its own previous item."];
        }

        if (request.NextItemId == itemId)
        {
            validationErrors["nextItemId"] = ["The moved item cannot be its own next item."];
        }

        if (request.PreviousItemId is not null && request.PreviousItemId == request.NextItemId)
        {
            validationErrors["nextItemId"] = ["Previous and next items must be different."];
        }

        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        await db.LockForItemOrderingAsync(listId, cancellationToken);

        var items = await db.ShoppingListItems
            .Where(i => i.ShoppingListId == listId)
            .OrderBy(i => i.SortOrder)
            .ThenBy(i => i.Id)
            .ToListAsync(cancellationToken);
        var item = items.FirstOrDefault(i => i.Id == itemId);
        if (item is null)
        {
            return Results.NotFound();
        }

        var remainingItems = items.Where(i => i.Id != itemId).ToList();
        var previous = request.PreviousItemId is Guid previousId
            ? remainingItems.FirstOrDefault(i => i.Id == previousId)
            : null;
        var next = request.NextItemId is Guid nextId
            ? remainingItems.FirstOrDefault(i => i.Id == nextId)
            : null;

        if (request.PreviousItemId is not null && previous is null)
        {
            validationErrors["previousItemId"] = ["The previous item must belong to this list."];
        }

        if (request.NextItemId is not null && next is null)
        {
            validationErrors["nextItemId"] = ["The next item must belong to this list."];
        }

        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        var previousIndex = previous is null ? -1 : remainingItems.IndexOf(previous);
        var nextIndex = next is null ? remainingItems.Count : remainingItems.IndexOf(next);

        // A concurrent list change can make the client's intended insertion point ambiguous.
        if (nextIndex != previousIndex + 1)
        {
            return Results.Conflict();
        }

        if (items.IndexOf(item) == nextIndex)
        {
            return Results.NoContent();
        }

        if (ShoppingListItemOrdering.TryGetSortOrder(
                previous?.SortOrder,
                next?.SortOrder,
                out var sortOrder))
        {
            item.SortOrder = sortOrder;
        }
        else
        {
            // Normalize in the desired order only when no bounded integer position remains.
            remainingItems.Insert(nextIndex, item);
            ShoppingListItemOrdering.Normalize(remainingItems);
        }

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Results.NoContent();
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

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        await db.LockForItemOrderingAsync(listId, cancellationToken);

        var deleted = await db.ShoppingListItems
            .Where(i => i.Id == itemId && i.ShoppingListId == listId)
            .ExecuteDeleteAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return deleted == 0 ? Results.NotFound() : Results.NoContent();
    }
}
