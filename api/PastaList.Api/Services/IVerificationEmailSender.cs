namespace PastaList.Api.Services;

public interface IVerificationEmailSender
{
    Task SendAsync(string email, string code, CancellationToken cancellationToken);
}
