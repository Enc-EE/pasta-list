namespace PastaList.Api.Domain;

public class ShoppingList
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public bool IsArchived { get; set; }

    // The user who created the list; always also has an Owner membership row.
    public Guid OwnerId { get; set; }

    public ICollection<ShoppingListItem> Items { get; set; } = new List<ShoppingListItem>();

    public ICollection<ShoppingListMember> Members { get; set; } = new List<ShoppingListMember>();

    public ICollection<ShoppingListInvitation> Invitations { get; set; } = new List<ShoppingListInvitation>();
}
