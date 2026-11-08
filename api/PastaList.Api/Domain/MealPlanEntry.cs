namespace PastaList.Api.Domain;

public class MealPlanEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid MealPlanId { get; set; }

    public MealPlan? MealPlan { get; set; }

    public DateOnly Date { get; set; }

    public MealPlanSlot Slot { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
