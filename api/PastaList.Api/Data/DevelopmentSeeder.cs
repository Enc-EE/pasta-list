using Microsoft.EntityFrameworkCore;
using PastaList.Api.Data;
using PastaList.Api.Domain;

/// <summary>Seeds a small demo data set for local development only.</summary>
public static class DevelopmentSeeder
{
    public static async Task SeedAsync(PastaListDbContext db, CancellationToken cancellationToken = default)
    {
        if (await db.ShoppingLists.AnyAsync(cancellationToken))
        {
            return;
        }

        var list = new ShoppingList
        {
            Name = "Pasta Night",
            Description = "Everything needed for a proper carbonara.",
            Items =
            [
                new ShoppingListItem { Name = "Spaghetti", Quantity = 500, Unit = "g", Category = "Pasta", SortOrder = 0 },
                new ShoppingListItem { Name = "Guanciale", Quantity = 150, Unit = "g", Category = "Meat", SortOrder = 1 },
                new ShoppingListItem { Name = "Pecorino Romano", Quantity = 100, Unit = "g", Category = "Dairy", SortOrder = 2 },
                new ShoppingListItem { Name = "Eggs", Quantity = 4, Unit = "pcs", Category = "Dairy", SortOrder = 3 }
            ]
        };

        db.ShoppingLists.Add(list);
        await db.SaveChangesAsync(cancellationToken);
    }
}
