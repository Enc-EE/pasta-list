using PastaList.Api.Contracts;
using PastaList.Api.Domain;

namespace PastaList.Api.Mapping;

public static class ShoppingListMappings
{
    public static ShoppingListItemDto ToDto(this ShoppingListItem item) => new(
        item.Id,
        item.ShoppingListId,
        item.Name,
        item.Quantity,
        item.Unit,
        item.Category,
        item.Note,
        item.IsChecked,
        item.SortOrder);

    public static ShoppingListDto ToDto(this ShoppingList list, ShoppingListRole role) => new(
        list.Id,
        list.Name,
        list.Description,
        list.IsArchived,
        list.CreatedAt,
        list.UpdatedAt,
        role.ToString(),
        list.Items.OrderBy(i => i.SortOrder).Select(ToDto).ToList());

    public static ShoppingListSummaryDto ToSummaryDto(this ShoppingList list, ShoppingListRole role) => new(
        list.Id,
        list.Name,
        list.Description,
        list.IsArchived,
        list.Items.Count,
        list.Items.Count(i => i.IsChecked),
        list.CreatedAt,
        list.UpdatedAt,
        role.ToString());

    public static ShoppingListMemberDto ToDto(this ShoppingListMember member) => new(
        member.Id,
        member.UserId,
        member.User?.Email ?? string.Empty,
        member.Role.ToString(),
        member.CreatedAt);

    public static bool TryParseRole(string? value, out ShoppingListRole role) =>
        Enum.TryParse(value, ignoreCase: true, out role) && Enum.IsDefined(role);
}
