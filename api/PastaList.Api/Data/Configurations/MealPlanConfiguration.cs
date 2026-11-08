using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PastaList.Api.Domain;

namespace PastaList.Api.Data.Configurations;

public class MealPlanConfiguration : IEntityTypeConfiguration<MealPlan>
{
    public void Configure(EntityTypeBuilder<MealPlan> builder)
    {
        builder.ToTable("meal_plans");

        builder.HasKey(x => x.Id);

        builder.HasMany(x => x.Entries)
            .WithOne(x => x.MealPlan)
            .HasForeignKey(x => x.MealPlanId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Members)
            .WithOne(x => x.MealPlan)
            .HasForeignKey(x => x.MealPlanId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Invitations)
            .WithOne(x => x.MealPlan)
            .HasForeignKey(x => x.MealPlanId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class MealPlanEntryConfiguration : IEntityTypeConfiguration<MealPlanEntry>
{
    public void Configure(EntityTypeBuilder<MealPlanEntry> builder)
    {
        builder.ToTable("meal_plan_entries");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.HasIndex(x => new { x.MealPlanId, x.Date, x.Slot });
    }
}

public class MealPlanMemberConfiguration : IEntityTypeConfiguration<MealPlanMember>
{
    public void Configure(EntityTypeBuilder<MealPlanMember> builder)
    {
        builder.ToTable("meal_plan_members");

        builder.HasKey(x => x.Id);

        // A user can belong to only one meal plan, whether as owner or member.
        builder.HasIndex(x => x.UserId).IsUnique();
        builder.HasIndex(x => new { x.MealPlanId, x.UserId }).IsUnique();

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class MealPlanInvitationConfiguration : IEntityTypeConfiguration<MealPlanInvitation>
{
    public void Configure(EntityTypeBuilder<MealPlanInvitation> builder)
    {
        builder.ToTable("meal_plan_invitations");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Email).HasMaxLength(320).IsRequired();
        builder.HasIndex(x => new { x.MealPlanId, x.Email }).IsUnique();
        builder.HasIndex(x => new { x.Email, x.AcceptedAt });
    }
}
