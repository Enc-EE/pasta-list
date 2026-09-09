using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PastaList.Api.Domain;

namespace PastaList.Api.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(user => user.Id);
        builder.Property(user => user.Email).HasMaxLength(320).IsRequired();
        builder.Property(user => user.SecurityStamp).HasMaxLength(64).IsRequired();
        builder.HasIndex(user => user.Email).IsUnique();
    }
}

public class LoginCodeConfiguration : IEntityTypeConfiguration<LoginCode>
{
    public void Configure(EntityTypeBuilder<LoginCode> builder)
    {
        builder.ToTable("login_codes");
        builder.HasKey(code => code.Id);
        builder.Property(code => code.Email).HasMaxLength(320).IsRequired();
        builder.Property(code => code.CodeHash).HasMaxLength(32).IsRequired();
        builder.Property(code => code.RequestedFromIp).HasMaxLength(45);
        builder.HasIndex(code => new { code.Email, code.ExpiresAt });
    }
}
