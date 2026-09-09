using System.Net.Mail;

namespace PastaList.Api.Services;

public static class EmailAddressNormalizer
{
    public static string? Normalize(string? email)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Length > 320)
        {
            return null;
        }

        try
        {
            var address = new MailAddress(email.Trim());
            return string.Equals(address.Address, email.Trim(), StringComparison.OrdinalIgnoreCase)
                ? address.Address.ToLowerInvariant()
                : null;
        }
        catch (FormatException)
        {
            return null;
        }
    }
}
