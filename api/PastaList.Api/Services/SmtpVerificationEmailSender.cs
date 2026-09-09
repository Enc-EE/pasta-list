using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace PastaList.Api.Services;

public class SmtpVerificationEmailSender(
    IOptions<EmailOptions> options,
    IOptions<AuthOptions> authOptions) : IVerificationEmailSender
{
    private readonly EmailOptions emailOptions = options.Value;
    private readonly AuthOptions loginOptions = authOptions.Value;

    public async Task SendAsync(string email, string code, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(emailOptions.Host) || string.IsNullOrWhiteSpace(emailOptions.From))
        {
            throw new InvalidOperationException("Email:Host and Email:From must be configured.");
        }

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(emailOptions.From));
        message.To.Add(MailboxAddress.Parse(email));
        message.Subject = "Your Pasta List verification code";
        message.Body = new TextPart("plain")
        {
            Text = $"Your Pasta List verification code is {code}. It expires in {loginOptions.CodeLifetimeMinutes} minutes."
        };

        using var client = new SmtpClient();
        await client.ConnectAsync(emailOptions.Host, emailOptions.Port, SecureSocketOptions.StartTls, cancellationToken);

        if (!string.IsNullOrWhiteSpace(emailOptions.User))
        {
            await client.AuthenticateAsync(emailOptions.User, emailOptions.Password ?? string.Empty, cancellationToken);
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }
}
