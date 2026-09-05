namespace PastaList.Api.Domain;

public class ShoppingListItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ShoppingListId { get; set; }

    public ShoppingList? ShoppingList { get; set; }

    public string Name { get; set; } = string.Empty;

    public decimal Quantity { get; set; } = 1;

    /// <summary>Free text unit such as "kg", "pcs", "l". TODO: promote to a lookup table.</summary>
    public string? Unit { get; set; }

    public string? Category { get; set; }

    public string? Note { get; set; }

    public bool IsChecked { get; set; }

    /// <summary>Manual ordering inside a list; lower values come first.</summary>
    public int SortOrder { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
