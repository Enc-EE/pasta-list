namespace PastaList.Api.Domain;

public class LoginCode
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Email { get; set; } = string.Empty;

    public byte[] CodeHash { get; set; } = [];

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? ConsumedAt { get; set; }

    public int AttemptCount { get; set; }

    public string? RequestedFromIp { get; set; }
}
