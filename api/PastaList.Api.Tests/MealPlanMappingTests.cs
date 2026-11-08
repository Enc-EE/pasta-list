using PastaList.Api.Domain;
using PastaList.Api.Mapping;

namespace PastaList.Api.Tests;

public class MealPlanMappingTests
{
    [Theory]
    [InlineData("Lunch", MealPlanSlot.Lunch)]
    [InlineData("dinner", MealPlanSlot.Dinner)]
    public void TryParseSlot_AcceptsKnownSlotsCaseInsensitively(string value, MealPlanSlot expected)
    {
        Assert.True(MealPlanMappings.TryParseSlot(value, out var slot));
        Assert.Equal(expected, slot);
    }

    [Theory]
    [InlineData("Breakfast")]
    [InlineData("")]
    [InlineData(null)]
    public void TryParseSlot_RejectsUnknownSlots(string? value)
    {
        Assert.False(MealPlanMappings.TryParseSlot(value, out _));
    }

    [Fact]
    public void ToDto_OrdersEntriesByDateThenSlotThenCreationTime()
    {
        var plan = new MealPlan
        {
            Id = Guid.NewGuid(),
            CreatedAt = new DateTimeOffset(2026, 11, 8, 10, 0, 0, TimeSpan.Zero),
            UpdatedAt = new DateTimeOffset(2026, 11, 8, 11, 0, 0, TimeSpan.Zero)
        };

        var dinner = CreateEntry(plan.Id, new DateOnly(2026, 11, 9), MealPlanSlot.Dinner, "Soup", 1);
        var lunchLater = CreateEntry(plan.Id, new DateOnly(2026, 11, 9), MealPlanSlot.Lunch, "Pasta", 3);
        var lunchEarlier = CreateEntry(plan.Id, new DateOnly(2026, 11, 9), MealPlanSlot.Lunch, "Salad", 2);
        var previousDay = CreateEntry(plan.Id, new DateOnly(2026, 11, 8), MealPlanSlot.Dinner, "Pizza", 4);

        var dto = plan.ToDto(ShoppingListRole.Editor, [dinner, lunchLater, lunchEarlier, previousDay]);

        Assert.Equal("Editor", dto.Role);
        Assert.Equal(
            ["Pizza", "Salad", "Pasta", "Soup"],
            dto.Entries.Select(entry => entry.Name));
        Assert.Equal("Lunch", dto.Entries[1].Slot);
        Assert.Equal(new DateOnly(2026, 11, 9), dto.Entries[1].Date);
    }

    private static MealPlanEntry CreateEntry(
        Guid planId,
        DateOnly date,
        MealPlanSlot slot,
        string name,
        int createdAtMinute) =>
        new()
        {
            MealPlanId = planId,
            Date = date,
            Slot = slot,
            Name = name,
            CreatedAt = new DateTimeOffset(2026, 11, 8, 10, createdAtMinute, 0, TimeSpan.Zero),
            UpdatedAt = new DateTimeOffset(2026, 11, 8, 10, createdAtMinute, 0, TimeSpan.Zero)
        };
}
