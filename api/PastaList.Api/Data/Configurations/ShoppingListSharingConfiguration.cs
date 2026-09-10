using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PastaList.Api.Domain;

namespace PastaList.Api.Data.Configurations;

public class ShoppingListMemberConfiguration : IEntityTypeConfiguration<ShoppingListMember>
{
    public void Configure(EntityTypeBuilder<ShoppingListMember> builder)
    {
        builder.ToTable("shopping_list_members");
        builder.HasKey(member => member.Id);
        builder.HasIndex(member => new { member.ShoppingListId, member.UserId }).IsUnique();

        builder.HasOne(member => member.User)
            .WithMany()
            .HasForeignKey(member => member.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ShoppingListInvitationConfiguration : IEntityTypeConfiguration<ShoppingListInvitation>
{
    public void Configure(EntityTypeBuilder<ShoppingListInvitation> builder)
    {
        builder.ToTable("shopping_list_invitations");
        builder.HasKey(invitation => invitation.Id);
        builder.Property(invitation => invitation.Email).HasMaxLength(320).IsRequired();
        builder.HasIndex(invitation => new { invitation.ShoppingListId, invitation.Email }).IsUnique();
        builder.HasIndex(invitation => new { invitation.Email, invitation.AcceptedAt });
    }
}
