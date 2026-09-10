namespace PastaList.Api.Domain;

public class ShoppingListMember
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ShoppingListId { get; set; }

    public ShoppingList? ShoppingList { get; set; }

    public Guid UserId { get; set; }

    public User? User { get; set; }

    public ShoppingListRole Role { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
