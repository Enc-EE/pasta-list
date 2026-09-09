using System.Security.Claims;

namespace PastaList.Api.Services;

public interface ICurrentUser
{
    Guid? Id { get; }

    string? Email { get; }
}

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => httpContextAccessor.HttpContext?.User;

    public Guid? Id => Guid.TryParse(Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
        ? id
        : null;

    public string? Email => Principal?.FindFirstValue(ClaimTypes.Email);
}
