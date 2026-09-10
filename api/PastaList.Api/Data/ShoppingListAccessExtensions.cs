using Microsoft.EntityFrameworkCore;
using PastaList.Api.Domain;

namespace PastaList.Api.Data;

public static class ShoppingListAccessExtensions
{
    public static Task<ShoppingListRole?> GetMemberRoleAsync(
        this PastaListDbContext db,
        Guid listId,
        Guid userId,
        CancellationToken cancellationToken) =>
        db.ShoppingListMembers.AsNoTracking()
            .Where(member => member.ShoppingListId == listId && member.UserId == userId)
            .Select(member => (ShoppingListRole?)member.Role)
            .FirstOrDefaultAsync(cancellationToken);

    public static IQueryable<ShoppingList> AccessibleTo(this IQueryable<ShoppingList> query, Guid userId) =>
        query.Where(list => list.Members.Any(member => member.UserId == userId));
}
