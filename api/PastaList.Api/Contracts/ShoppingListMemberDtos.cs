namespace PastaList.Api.Contracts;

public record ShoppingListMemberDto(Guid Id, Guid UserId, string Email, string Role, DateTimeOffset CreatedAt);

public record InviteShoppingListMemberRequest(string Email, string Role);

public record UpdateShoppingListMemberRoleRequest(string Role);
