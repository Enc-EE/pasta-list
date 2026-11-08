using PastaList.Api.Contracts;
using PastaList.Api.Domain;

namespace PastaList.Api.Mapping;

public static class MealPlanMappings
{
    public static MealPlanEntryDto ToDto(this MealPlanEntry entry) => new(
        entry.Id,
        entry.MealPlanId,
        entry.Date,
        entry.Slot.ToString(),
        entry.Name,
        entry.CreatedAt,
        entry.UpdatedAt);

    public static MealPlanDto ToDto(
        this MealPlan plan,
        ShoppingListRole role,
        IEnumerable<MealPlanEntry> entries) => new(
        plan.Id,
        role.ToString(),
        plan.CreatedAt,
        plan.UpdatedAt,
        entries
            .OrderBy(entry => entry.Date)
            .ThenBy(entry => entry.Slot)
            .ThenBy(entry => entry.CreatedAt)
            .ThenBy(entry => entry.Id)
            .Select(ToDto)
            .ToList());

    public static MealPlanMemberDto ToDto(this MealPlanMember member) => new(
        member.Id,
        member.UserId,
        member.User?.Email ?? string.Empty,
        member.Role.ToString(),
        member.CreatedAt);

    public static bool TryParseSlot(string? value, out MealPlanSlot slot) =>
        Enum.TryParse(value, ignoreCase: true, out slot) && Enum.IsDefined(slot);
}
