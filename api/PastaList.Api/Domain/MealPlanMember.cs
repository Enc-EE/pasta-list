namespace PastaList.Api.Domain;

public class MealPlanMember
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid MealPlanId { get; set; }

    public MealPlan? MealPlan { get; set; }

    public Guid UserId { get; set; }

    public User? User { get; set; }

    public ShoppingListRole Role { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
