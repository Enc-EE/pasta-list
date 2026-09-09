using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PastaList.Api.Data;
using PastaList.Api.Domain;

namespace PastaList.Api.Services;

public enum LoginCodeVerificationResult
{
    Success,
    Invalid,
    Expired,
    AttemptsExceeded
}

public class LoginCodeService(
    PastaListDbContext db,
    IOptions<AuthOptions> options)
{
    private readonly AuthOptions authOptions = options.Value;

    public async Task<string> CreateAsync(
        string email,
        string? requestedFromIp,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(authOptions.CodeHashKey))
        {
            throw new InvalidOperationException("Auth:CodeHashKey must be configured.");
        }

        var outstandingCodes = await db.LoginCodes
            .Where(code => code.Email == email && code.ConsumedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var outstandingCode in outstandingCodes)
        {
            outstandingCode.ConsumedAt = DateTimeOffset.UtcNow;
        }

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        db.LoginCodes.Add(new LoginCode
        {
            Email = email,
            CodeHash = HashCode(email, code),
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(authOptions.CodeLifetimeMinutes),
            RequestedFromIp = requestedFromIp
        });

        await db.SaveChangesAsync(cancellationToken);
        return code;
    }

    public async Task<LoginCodeVerificationResult> VerifyAsync(
        string email,
        string code,
        CancellationToken cancellationToken)
    {
        var loginCode = await db.LoginCodes
            .Where(item => item.Email == email && item.ConsumedAt == null)
            .OrderByDescending(item => item.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (loginCode is null)
        {
            return LoginCodeVerificationResult.Invalid;
        }

        if (loginCode.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            loginCode.ConsumedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
            return LoginCodeVerificationResult.Expired;
        }

        if (loginCode.AttemptCount >= authOptions.MaxCodeAttempts)
        {
            loginCode.ConsumedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
            return LoginCodeVerificationResult.AttemptsExceeded;
        }

        loginCode.AttemptCount++;
        var expectedHash = HashCode(email, code);
        var isValid = CryptographicOperations.FixedTimeEquals(loginCode.CodeHash, expectedHash);

        if (isValid)
        {
            loginCode.ConsumedAt = DateTimeOffset.UtcNow;
        }
        else if (loginCode.AttemptCount >= authOptions.MaxCodeAttempts)
        {
            loginCode.ConsumedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        return isValid ? LoginCodeVerificationResult.Success : LoginCodeVerificationResult.Invalid;
    }

    private byte[] HashCode(string email, string code)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(authOptions.CodeHashKey));
        return hmac.ComputeHash(Encoding.UTF8.GetBytes($"{email}:{code}"));
    }
}
