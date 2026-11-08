using Microsoft.EntityFrameworkCore;
using PastaList.Api.Contracts;
using PastaList.Api.Data;
using PastaList.Api.Domain;
using PastaList.Api.Mapping;
using PastaList.Api.Services;

namespace PastaList.Api.Endpoints;

public static class MealPlanEndpoints
{
    public static IEndpointRouteBuilder MapMealPlanEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/meal-plan")
            .WithTags("MealPlan")
            .RequireAuthorization();

        group.MapGet("/", GetMealPlan).WithName("GetMealPlan");
        group.MapPost("/", CreateMealPlan).WithName("CreateMealPlan");
        group.MapDelete("/", DeleteMealPlan).WithName("DeleteMealPlan");
        group.MapPost("/entries", CreateEntry).WithName("CreateMealPlanEntry");
        group.MapPut("/entries/{entryId:guid}", UpdateEntry).WithName("UpdateMealPlanEntry");
        group.MapPatch("/entries/{entryId:guid}/move", MoveEntry).WithName("MoveMealPlanEntry");
        group.MapDelete("/entries/{entryId:guid}", DeleteEntry).WithName("DeleteMealPlanEntry");

        var members = app.MapGroup("/api/meal-plan/members")
            .WithTags("MealPlanMembers")
            .RequireAuthorization();

        members.MapGet("/", GetMembers).WithName("GetMealPlanMembers");
        members.MapPost("/", InviteMember).WithName("InviteMealPlanMember");
        members.MapPut("/{userId:guid}", UpdateMemberRole).WithName("UpdateMealPlanMemberRole");
        members.MapDelete("/{userId:guid}", RemoveMember).WithName("RemoveMealPlanMember");

        return app;
    }

    private static Task<MealPlanMember?> GetMembershipAsync(
        PastaListDbContext db,
        Guid userId,
        CancellationToken cancellationToken) =>
        db.MealPlanMembers.AsNoTracking().FirstOrDefaultAsync(member => member.UserId == userId, cancellationToken);

    private static IResult? RequireEditor(MealPlanMember? membership) =>
        membership is { Role: ShoppingListRole.Viewer }
            ? Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Viewers cannot modify this meal plan.")
            : null;

    private static async Task<IResult> GetMealPlan(
        PastaListDbContext db,
        ICurrentUser currentUser,
        DateOnly? from,
        DateOnly? to,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
        {
            return Results.Unauthorized();
        }

        var membership = await GetMembershipAsync(db, userId, cancellationToken);
        if (membership is null)
        {
            return Results.NotFound();
        }

        var plan = await db.MealPlans
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == membership.MealPlanId, cancellationToken);

        if (plan is null)
        {
            return Results.NotFound();
        }

        var entries = await db.MealPlanEntries
            .AsNoTracking()
            .Where(entry => entry.MealPlanId == membership.MealPlanId)
            .Where(entry => from == null || entry.Date >= from)
            .Where(entry => to == null || entry.Date <= to)
            .ToListAsync(cancellationToken);

        return Results.Ok(plan.ToDto(membership.Role, entries));
    }

    private static async Task<IResult> CreateMealPlan(
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
        {
            return Results.Unauthorized();
        }

        var alreadyHasPlan = await db.MealPlanMembers
            .AnyAsync(member => member.UserId == userId, cancellationToken);

        if (alreadyHasPlan)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "You already have a meal plan.");
        }

        var plan = new MealPlan { OwnerId = userId };
        plan.Members.Add(new MealPlanMember
        {
            MealPlanId = plan.Id,
            UserId = userId,
            Role = ShoppingListRole.Owner
        });

        db.MealPlans.Add(plan);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created("/api/meal-plan", plan.ToDto(ShoppingListRole.Owner, Array.Empty<MealPlanEntry>()));
    }

    private static async Task<IResult> DeleteMealPlan(
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
        {
            return Results.Unauthorized();
        }

        var membership = await GetMembershipAsync(db, userId, cancellationToken);
        if (membership is null)
        {
            return Results.NotFound();
        }

        if (membership.Role != ShoppingListRole.Owner)
        {
            return Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Only the owner can delete this meal plan.");
        }

        var plan = await db.MealPlans.FirstOrDefaultAsync(item => item.Id == membership.MealPlanId, cancellationToken);
        if (plan is null)
        {
            return Results.NotFound();
        }

        db.MealPlans.Remove(plan);
        await db.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }

    private static async Task<IResult> CreateEntry(
        CreateMealPlanEntryRequest request,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
        {
            return Results.Unauthorized();
        }

        var membership = await GetMembershipAsync(db, userId, cancellationToken);
        if (membership is null)
        {
            return Results.NotFound();
        }

        if (RequireEditor(membership) is { } denied)
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

        if (!MealPlanMappings.TryParseSlot(request.Slot, out var slot))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["slot"] = ["Enter a valid meal slot."]
            });
        }

        var entry = new MealPlanEntry
        {
            MealPlanId = membership.MealPlanId,
            Date = request.Date,
            Slot = slot,
            Name = request.Name.Trim()
        };

        db.MealPlanEntries.Add(entry);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/meal-plan/entries/{entry.Id}", entry.ToDto());
    }

    private static async Task<IResult> UpdateEntry(
        Guid entryId,
        UpdateMealPlanEntryRequest request,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
        {
            return Results.Unauthorized();
        }

        var membership = await GetMembershipAsync(db, userId, cancellationToken);
        if (membership is null)
        {
            return Results.NotFound();
        }

        if (RequireEditor(membership) is { } denied)
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

        var entry = await db.MealPlanEntries.FirstOrDefaultAsync(
            item => item.Id == entryId && item.MealPlanId == membership.MealPlanId,
            cancellationToken);

        if (entry is null)
        {
            return Results.NotFound();
        }

        entry.Name = request.Name.Trim();
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(entry.ToDto());
    }

    private static async Task<IResult> MoveEntry(
        Guid entryId,
        MoveMealPlanEntryRequest request,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
        {
            return Results.Unauthorized();
        }

        var membership = await GetMembershipAsync(db, userId, cancellationToken);
        if (membership is null)
        {
            return Results.NotFound();
        }

        if (RequireEditor(membership) is { } denied)
        {
            return denied;
        }

        if (!MealPlanMappings.TryParseSlot(request.Slot, out var slot))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["slot"] = ["Enter a valid meal slot."]
            });
        }

        var entry = await db.MealPlanEntries.FirstOrDefaultAsync(
            item => item.Id == entryId && item.MealPlanId == membership.MealPlanId,
            cancellationToken);

        if (entry is null)
        {
            return Results.NotFound();
        }

        entry.Date = request.Date;
        entry.Slot = slot;
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(entry.ToDto());
    }

    private static async Task<IResult> DeleteEntry(
        Guid entryId,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
        {
            return Results.Unauthorized();
        }

        var membership = await GetMembershipAsync(db, userId, cancellationToken);
        if (membership is null)
        {
            return Results.NotFound();
        }

        if (RequireEditor(membership) is { } denied)
        {
            return denied;
        }

        var deleted = await db.MealPlanEntries
            .Where(item => item.Id == entryId && item.MealPlanId == membership.MealPlanId)
            .ExecuteDeleteAsync(cancellationToken);

        return deleted == 0 ? Results.NotFound() : Results.NoContent();
    }

    private static async Task<IResult> GetMembers(
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
        {
            return Results.Unauthorized();
        }

        var membership = await GetMembershipAsync(db, userId, cancellationToken);
        if (membership is null)
        {
            return Results.NotFound();
        }

        var members = await db.MealPlanMembers
            .AsNoTracking()
            .Include(member => member.User)
            .Where(member => member.MealPlanId == membership.MealPlanId)
            .OrderBy(member => member.CreatedAt)
            .ToListAsync(cancellationToken);

        return Results.Ok(members.Select(member => member.ToDto()));
    }

    private static async Task<IResult> InviteMember(
        InviteMealPlanMemberRequest request,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
        {
            return Results.Unauthorized();
        }

        var membership = await GetMembershipAsync(db, userId, cancellationToken);
        if (membership is null)
        {
            return Results.NotFound();
        }

        if (membership.Role != ShoppingListRole.Owner)
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

        var invitedUser = await db.Users.FirstOrDefaultAsync(user => user.Email == email, cancellationToken);
        if (invitedUser is not null)
        {
            var alreadyHasPlan = await db.MealPlanMembers
                .AnyAsync(member => member.UserId == invitedUser.Id, cancellationToken);

            if (alreadyHasPlan)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "This person already has a meal plan.");
            }

            var member = new MealPlanMember
            {
                MealPlanId = membership.MealPlanId,
                UserId = invitedUser.Id,
                Role = invitedRole
            };

            db.MealPlanMembers.Add(member);
            await db.SaveChangesAsync(cancellationToken);

            return Results.Created(
                $"/api/meal-plan/members/{invitedUser.Id}",
                new MealPlanMemberDto(member.Id, invitedUser.Id, invitedUser.Email, invitedRole.ToString(), member.CreatedAt));
        }

        var invitation = await db.MealPlanInvitations.FirstOrDefaultAsync(
            item => item.MealPlanId == membership.MealPlanId && item.Email == email,
            cancellationToken);

        if (invitation is null)
        {
            invitation = new MealPlanInvitation { MealPlanId = membership.MealPlanId, Email = email };
            db.MealPlanInvitations.Add(invitation);
        }

        invitation.Role = invitedRole;
        invitation.ExpiresAt = DateTimeOffset.UtcNow.AddDays(30);
        invitation.AcceptedAt = null;

        await db.SaveChangesAsync(cancellationToken);

        return Results.Accepted();
    }

    private static async Task<IResult> UpdateMemberRole(
        Guid userId,
        UpdateMealPlanMemberRoleRequest request,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } currentUserId)
        {
            return Results.Unauthorized();
        }

        var membership = await GetMembershipAsync(db, currentUserId, cancellationToken);
        if (membership is null)
        {
            return Results.NotFound();
        }

        if (membership.Role != ShoppingListRole.Owner)
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

        var member = await db.MealPlanMembers.FirstOrDefaultAsync(
            item => item.MealPlanId == membership.MealPlanId && item.UserId == userId,
            cancellationToken);

        if (member is null)
        {
            return Results.NotFound();
        }

        if (member.Role == ShoppingListRole.Owner && newRole != ShoppingListRole.Owner)
        {
            var ownerCount = await db.MealPlanMembers.CountAsync(
                item => item.MealPlanId == membership.MealPlanId && item.Role == ShoppingListRole.Owner,
                cancellationToken);

            if (ownerCount <= 1)
            {
                return Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: "A meal plan must keep at least one owner.");
            }
        }

        member.Role = newRole;
        await db.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }

    private static async Task<IResult> RemoveMember(
        Guid userId,
        PastaListDbContext db,
        ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } currentUserId)
        {
            return Results.Unauthorized();
        }

        var membership = await GetMembershipAsync(db, currentUserId, cancellationToken);
        if (membership is null)
        {
            return Results.NotFound();
        }

        var isSelfRemoval = userId == currentUserId;
        if (membership.Role != ShoppingListRole.Owner && !isSelfRemoval)
        {
            return Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Only the owner can remove other members.");
        }

        var member = await db.MealPlanMembers.FirstOrDefaultAsync(
            item => item.MealPlanId == membership.MealPlanId && item.UserId == userId,
            cancellationToken);

        if (member is null)
        {
            return Results.NotFound();
        }

        if (member.Role == ShoppingListRole.Owner)
        {
            var ownerCount = await db.MealPlanMembers.CountAsync(
                item => item.MealPlanId == membership.MealPlanId && item.Role == ShoppingListRole.Owner,
                cancellationToken);

            if (ownerCount <= 1)
            {
                return Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: "A meal plan must keep at least one owner.");
            }
        }

        db.MealPlanMembers.Remove(member);
        await db.SaveChangesAsync(cancellationToken);

        return Results.NoContent();
    }
}
