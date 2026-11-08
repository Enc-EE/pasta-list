namespace PastaList.Api.Contracts;

public record MealPlanDto(
    Guid Id,
    string Role,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<MealPlanEntryDto> Entries);

public record MealPlanEntryDto(
    Guid Id,
    Guid MealPlanId,
    DateOnly Date,
    string Slot,
    string Name,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public record CreateMealPlanEntryRequest(
    DateOnly Date,
    string Slot,
    string Name);

public record UpdateMealPlanEntryRequest(string Name);

public record MoveMealPlanEntryRequest(
    DateOnly Date,
    string Slot);

public record MealPlanMemberDto(
    Guid Id,
    Guid UserId,
    string Email,
    string Role,
    DateTimeOffset CreatedAt);

public record InviteMealPlanMemberRequest(string Email, string Role);

public record UpdateMealPlanMemberRoleRequest(string Role);
