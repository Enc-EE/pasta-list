namespace PastaList.Api.Contracts;

public record ShoppingListSummaryDto(
    Guid Id,
    string Name,
    string? Description,
    bool IsArchived,
    int ItemCount,
    int CheckedItemCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public record ShoppingListDto(
    Guid Id,
    string Name,
    string? Description,
    bool IsArchived,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<ShoppingListItemDto> Items);

public record ShoppingListItemDto(
    Guid Id,
    Guid ShoppingListId,
    string Name,
    decimal Quantity,
    string? Unit,
    string? Category,
    string? Note,
    bool IsChecked,
    int SortOrder);

public record CreateShoppingListRequest(string Name, string? Description);

public record UpdateShoppingListRequest(string Name, string? Description, bool IsArchived);

public record CreateShoppingListItemRequest(
    string Name,
    decimal Quantity,
    string? Unit,
    string? Category,
    string? Note);

public record UpdateShoppingListItemRequest(
    string Name,
    decimal Quantity,
    string? Unit,
    string? Category,
    string? Note,
    bool IsChecked,
    int SortOrder);
