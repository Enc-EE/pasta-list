namespace PastaList.Api.Domain;

public class ShoppingListInvitation
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ShoppingListId { get; set; }

    public ShoppingList? ShoppingList { get; set; }

    public string Email { get; set; } = string.Empty;

    public ShoppingListRole Role { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? AcceptedAt { get; set; }
}
