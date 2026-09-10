using Microsoft.EntityFrameworkCore;
using PastaList.Api.Contracts;
using PastaList.Api.Data;
using PastaList.Api.Domain;
using PastaList.Api.Mapping;
using PastaList.Api.Services;

namespace PastaList.Api.Endpoints;

public static class ShoppingListEndpoints
{
    public static IEndpointRouteBuilder MapShoppingListEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/lists")
            .WithTags("ShoppingLists")
            .RequireAuthorization();

        group.MapGet("/", GetLists).WithName("GetShoppingLists");
        group.MapGet("/{id:guid}", GetList).WithName("GetShoppingList");
        group.MapPost("/", CreateList).WithName("CreateShoppingList");
        group.MapPut("/{id:guid}", UpdateList).WithName("UpdateShoppingList");
        group.MapDelete("/{id:guid}", DeleteList).WithName("DeleteShoppingList");

        return app;
    }

    private static async Task<IResult> GetLists(
        PastaListDbContext db,
        ICurrentUser currentUser,
        bool includeArchived = false,
        CancellationToken cancellationToken = default)
    {
        var userId = currentUser.Id!.Value;

        var lists = await db.ShoppingLists
            .AsNoTracking()
            .Where(l => includeArchived || !l.IsArchived)
            .Where(l => l.Members.Any(m => m.UserId == userId))
            .Include(l => l.Items)
            .Include(l => l.Members.Where(m => m.UserId == userId))
            .AsSplitQuery()
            .OrderByDescending(l => l.UpdatedAt)
            .ToListAsync(cancellationToken);

        return Results.Ok(lists.Select(l => l.ToSummaryDto(l.Members.First(m => m.UserId == userId).Role)));
    }

    private static async Task<IResult> GetList(
        Guid id,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.Id!.Value;

        var list = await db.ShoppingLists
            .AsNoTracking()
            .Include(l => l.Items)
            .Include(l => l.Members.Where(m => m.UserId == userId))
            .AsSplitQuery()
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        var membership = list?.Members.FirstOrDefault(m => m.UserId == userId);
        if (list is null || membership is null)
        {
            // Membership missing is indistinguishable from a nonexistent list, on purpose.
            return Results.NotFound();
        }

        return Results.Ok(list.ToDto(membership.Role));
    }

    private static async Task<IResult> CreateList(
        CreateShoppingListRequest request,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["name"] = ["Name is required."]
            });
        }

        var userId = currentUser.Id!.Value;
        var list = new ShoppingList
        {
            Name = request.Name.Trim(),
            Description = request.Description,
            OwnerId = userId
        };
        list.Members.Add(new ShoppingListMember { ShoppingListId = list.Id, UserId = userId, Role = ShoppingListRole.Owner });

        db.ShoppingLists.Add(list);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/lists/{list.Id}", list.ToDto(ShoppingListRole.Owner));
    }

    private static async Task<IResult> UpdateList(
        Guid id,
        UpdateShoppingListRequest request,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.Id!.Value;
        var role = await db.GetMemberRoleAsync(id, userId, cancellationToken);
        if (role is null)
        {
            return Results.NotFound();
        }

        if (role != ShoppingListRole.Owner)
        {
            return Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Only the owner can update this list.");
        }

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

        return Results.Ok(list.ToDto(ShoppingListRole.Owner));
    }

    private static async Task<IResult> DeleteList(
        Guid id,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.Id!.Value;
        var role = await db.GetMemberRoleAsync(id, userId, cancellationToken);
        if (role is null)
        {
            return Results.NotFound();
        }

        if (role != ShoppingListRole.Owner)
        {
            return Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Only the owner can delete this list.");
        }

        var deleted = await db.ShoppingLists
            .Where(l => l.Id == id)
            .ExecuteDeleteAsync(cancellationToken);

        return deleted == 0 ? Results.NotFound() : Results.NoContent();
    }
}
