using Microsoft.Extensions.Logging;

namespace PastaList.Api.Services;

public class LoggingVerificationEmailSender(ILogger<LoggingVerificationEmailSender> logger)
    : IVerificationEmailSender
{
    public Task SendAsync(string email, string code, CancellationToken cancellationToken)
    {
        logger.LogInformation("Development login code for {Email}: {Code}", email, code);
        return Task.CompletedTask;
    }
}
