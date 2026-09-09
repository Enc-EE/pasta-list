namespace PastaList.Api.Services;

public class AuthOptions
{
    public string CodeHashKey { get; set; } = string.Empty;

    public int CodeLifetimeMinutes { get; set; } = 10;

    public int MaxCodeAttempts { get; set; } = 5;
}

public class EmailOptions
{
    public string Host { get; set; } = string.Empty;

    public int Port { get; set; } = 587;

    public string? User { get; set; }

    public string? Password { get; set; }

    public string From { get; set; } = string.Empty;
}
