namespace PastaList.Api.Domain;

public class MealPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OwnerId { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<MealPlanEntry> Entries { get; set; } = new List<MealPlanEntry>();

    public ICollection<MealPlanMember> Members { get; set; } = new List<MealPlanMember>();

    public ICollection<MealPlanInvitation> Invitations { get; set; } = new List<MealPlanInvitation>();
}
