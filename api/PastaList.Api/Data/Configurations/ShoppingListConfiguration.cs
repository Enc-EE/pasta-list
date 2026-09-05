using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PastaList.Api.Domain;

namespace PastaList.Api.Data.Configurations;

public class ShoppingListConfiguration : IEntityTypeConfiguration<ShoppingList>
{
    public void Configure(EntityTypeBuilder<ShoppingList> builder)
    {
        builder.ToTable("shopping_lists");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(1000);

        builder.HasIndex(x => x.IsArchived);

        builder.HasMany(x => x.Items)
            .WithOne(x => x.ShoppingList)
            .HasForeignKey(x => x.ShoppingListId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ShoppingListItemConfiguration : IEntityTypeConfiguration<ShoppingListItem>
{
    public void Configure(EntityTypeBuilder<ShoppingListItem> builder)
    {
        builder.ToTable("shopping_list_items");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.Quantity)
            .HasPrecision(10, 3);

        builder.Property(x => x.Unit).HasMaxLength(20);
        builder.Property(x => x.Category).HasMaxLength(80);
        builder.Property(x => x.Note).HasMaxLength(1000);

        builder.HasIndex(x => new { x.ShoppingListId, x.SortOrder });
    }
}
