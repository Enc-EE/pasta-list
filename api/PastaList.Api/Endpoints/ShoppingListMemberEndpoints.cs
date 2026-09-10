using Microsoft.EntityFrameworkCore;
using PastaList.Api.Contracts;
using PastaList.Api.Data;
using PastaList.Api.Domain;
using PastaList.Api.Mapping;
using PastaList.Api.Services;

namespace PastaList.Api.Endpoints;

public static class ShoppingListMemberEndpoints
{
    public static IEndpointRouteBuilder MapShoppingListMemberEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/lists/{listId:guid}/members")
            .WithTags("ShoppingListMembers")
            .RequireAuthorization();

        group.MapGet("/", GetMembers).WithName("GetShoppingListMembers");
        group.MapPost("/", InviteMember).WithName("InviteShoppingListMember");
        group.MapPut("/{userId:guid}", UpdateMemberRole).WithName("UpdateShoppingListMemberRole");
        group.MapDelete("/{userId:guid}", RemoveMember).WithName("RemoveShoppingListMember");

        return app;
    }

    private static async Task<IResult> GetMembers(
        Guid listId,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var role = await db.GetMemberRoleAsync(listId, currentUser.Id!.Value, cancellationToken);
        if (role is null)
        {
            return Results.NotFound();
        }

        var members = await db.ShoppingListMembers
            .AsNoTracking()
            .Include(m => m.User)
            .Where(m => m.ShoppingListId == listId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync(cancellationToken);

        return Results.Ok(members.Select(m => m.ToDto()));
    }

    private static async Task<IResult> InviteMember(
        Guid listId,
        InviteShoppingListMemberRequest request,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var role = await db.GetMemberRoleAsync(listId, currentUser.Id!.Value, cancellationToken);
        if (role is null)
        {
            return Results.NotFound();
        }

        if (role != ShoppingListRole.Owner)
        {
            return Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Only the owner can invite members.");
        }

        var email = EmailAddressNormalizer.Normalize(request.Email);
        if (email is null || !ShoppingListMappings.TryParseRole(request.Role, out var invitedRole))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["email"] = ["Enter a valid email address and role."]
            });
        }

        var invitedUser = await db.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (invitedUser is not null)
        {
            var alreadyMember = await db.ShoppingListMembers
                .AnyAsync(m => m.ShoppingListId == listId && m.UserId == invitedUser.Id, cancellationToken);
            if (alreadyMember)
            {
                return Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "This person is already a member.");
            }

            var member = new ShoppingListMember { ShoppingListId = listId, UserId = invitedUser.Id, Role = invitedRole };
            db.ShoppingListMembers.Add(member);
            await db.SaveChangesAsync(cancellationToken);

            return Results.Created(
                $"/api/lists/{listId}/members/{invitedUser.Id}",
                new ShoppingListMemberDto(member.Id, invitedUser.Id, invitedUser.Email, invitedRole.ToString(), member.CreatedAt));
        }

        var invitation = await db.ShoppingListInvitations
            .FirstOrDefaultAsync(i => i.ShoppingListId == listId && i.Email == email, cancellationToken);

        if (invitation is null)
        {
            invitation = new ShoppingListInvitation { ShoppingListId = listId, Email = email };
            db.ShoppingListInvitations.Add(invitation);
        }

        invitation.Role = invitedRole;
        invitation.ExpiresAt = DateTimeOffset.UtcNow.AddDays(30);
        invitation.AcceptedAt = null;

        await db.SaveChangesAsync(cancellationToken);

        // No account exists yet; membership is granted automatically at their next login.
        return Results.Accepted();
    }

    private static async Task<IResult> UpdateMemberRole(
        Guid listId,
        Guid userId,
        UpdateShoppingListMemberRoleRequest request,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var role = await db.GetMemberRoleAsync(listId, currentUser.Id!.Value, cancellationToken);
        if (role is null)
        {
            return Results.NotFound();
        }

        if (role != ShoppingListRole.Owner)
        {
            return Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Only the owner can change member roles.");
        }

        if (!ShoppingListMappings.TryParseRole(request.Role, out var newRole))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["role"] = ["Enter a valid role."]
            });
        }

        var member = await db.ShoppingListMembers
            .FirstOrDefaultAsync(m => m.ShoppingListId == listId && m.UserId == userId, cancellationToken);

        if (member is null)
        {
            return Results.NotFound();
        }

        if (member.Role == ShoppingListRole.Owner && newRole != ShoppingListRole.Owner)
        {
            var ownerCount = await db.ShoppingListMembers
                .CountAsync(m => m.ShoppingListId == listId && m.Role == ShoppingListRole.Owner, cancellationToken);

            if (ownerCount <= 1)
            {
                return Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: "A list must keep at least one owner.");
            }
        }

        member.Role = newRole;
        await db.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }

    private static async Task<IResult> RemoveMember(
        Guid listId,
        Guid userId,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var role = await db.GetMemberRoleAsync(listId, currentUser.Id!.Value, cancellationToken);
        if (role is null)
        {
            return Results.NotFound();
        }

        var isSelfRemoval = userId == currentUser.Id!.Value;
        if (role != ShoppingListRole.Owner && !isSelfRemoval)
        {
            return Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Only the owner can remove other members.");
        }

        var member = await db.ShoppingListMembers
            .FirstOrDefaultAsync(m => m.ShoppingListId == listId && m.UserId == userId, cancellationToken);

        if (member is null)
        {
            return Results.NotFound();
        }

        if (member.Role == ShoppingListRole.Owner)
        {
            var ownerCount = await db.ShoppingListMembers
                .CountAsync(m => m.ShoppingListId == listId && m.Role == ShoppingListRole.Owner, cancellationToken);

            if (ownerCount <= 1)
            {
                return Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: "A list must keep at least one owner.");
            }
        }

        db.ShoppingListMembers.Remove(member);
        await db.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
