using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PastaList.Api.Data;
using PastaList.Api.Services;

namespace PastaList.Api.Tests;

public class AuthServiceTests
{
    [Fact]
    public async Task LoginCode_IsSingleUse()
    {
        await using var db = CreateDbContext();
        var service = CreateLoginCodeService(db);
        var code = await service.CreateAsync("person@example.com", "127.0.0.1", CancellationToken.None);

        var firstAttempt = await service.VerifyAsync("person@example.com", code, CancellationToken.None);
        var secondAttempt = await service.VerifyAsync("person@example.com", code, CancellationToken.None);

        Assert.Equal(LoginCodeVerificationResult.Success, firstAttempt);
        Assert.Equal(LoginCodeVerificationResult.Invalid, secondAttempt);
    }

    [Fact]
    public async Task LoginCode_BurnsAfterMaximumFailedAttempts()
    {
        await using var db = CreateDbContext();
        var service = CreateLoginCodeService(db);
        var code = await service.CreateAsync("person@example.com", null, CancellationToken.None);

        for (var attempt = 0; attempt < 5; attempt++)
        {
            Assert.Equal(
                LoginCodeVerificationResult.Invalid,
                await service.VerifyAsync("person@example.com", "000000", CancellationToken.None));
        }

        Assert.Equal(
            LoginCodeVerificationResult.Invalid,
            await service.VerifyAsync("person@example.com", code, CancellationToken.None));
    }

    [Fact]
    public void EmailNormalizer_RejectsMalformedAddressesAndNormalizesValidAddresses()
    {
        Assert.Equal("person@example.com", EmailAddressNormalizer.Normalize(" Person@Example.COM "));
        Assert.Null(EmailAddressNormalizer.Normalize("not-an-email"));
        Assert.Null(EmailAddressNormalizer.Normalize(string.Empty));
    }

    private static PastaListDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<PastaListDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new PastaListDbContext(options);
    }

    private static LoginCodeService CreateLoginCodeService(PastaListDbContext db) =>
        new(db, Options.Create(new AuthOptions
        {
            CodeHashKey = "test-only-code-hash-key",
            CodeLifetimeMinutes = 10,
            MaxCodeAttempts = 5
        }));
}
