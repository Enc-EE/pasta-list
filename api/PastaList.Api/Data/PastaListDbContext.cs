using Microsoft.EntityFrameworkCore;
using PastaList.Api.Domain;

namespace PastaList.Api.Data;

public class PastaListDbContext(DbContextOptions<PastaListDbContext> options) : DbContext(options)
{
    public DbSet<ShoppingList> ShoppingLists => Set<ShoppingList>();

    public DbSet<ShoppingListItem> ShoppingListItems => Set<ShoppingListItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("pasta");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PastaListDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        TouchTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        TouchTimestamps();
        return base.SaveChanges();
    }

    private void TouchTimestamps()
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified))
            {
                continue;
            }

            if (entry.Entity is ShoppingList list)
            {
                list.UpdatedAt = now;
            }
            else if (entry.Entity is ShoppingListItem item)
            {
                item.UpdatedAt = now;
            }
        }
    }
}
