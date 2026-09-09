namespace PastaList.Api.Contracts;

public record RequestLoginCodeRequest(string Email);

public record VerifyLoginCodeRequest(string Email, string Code);

public record CurrentUserDto(Guid Id, string Email, DateTimeOffset CreatedAt, DateTimeOffset? LastLoginAt);
