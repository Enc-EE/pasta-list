using PastaList.Api.Domain;

namespace PastaList.Api.Tests;

public class ShoppingListItemOrderingTests
{
    [Theory]
    [InlineData(null, null, 1000)]
    [InlineData(null, 1000, 0)]
    [InlineData(1000, null, 2000)]
    [InlineData(1000, 2000, 1500)]
    [InlineData(1000, 1002, 1001)]
    public void TryGetSortOrder_UsesAvailableGap(
        int? previousSortOrder,
        int? nextSortOrder,
        int expected)
    {
        var result = ShoppingListItemOrdering.TryGetSortOrder(
            previousSortOrder,
            nextSortOrder,
            out var sortOrder);

        Assert.True(result);
        Assert.Equal(expected, sortOrder);
    }

    [Theory]
    [InlineData(1000, 1001)]
    [InlineData(1000, 1000)]
    [InlineData(2000, 1000)]
    [InlineData(null, -1_000_000_000)]
    [InlineData(1_000_000_000, null)]
    public void TryGetSortOrder_RejectsUnavailableOrOutOfRangePositions(
        int? previousSortOrder,
        int? nextSortOrder)
    {
        var result = ShoppingListItemOrdering.TryGetSortOrder(
            previousSortOrder,
            nextSortOrder,
            out _);

        Assert.False(result);
    }

    [Fact]
    public void Normalize_RestoresWideGapsInTheSuppliedOrder()
    {
        var items = new List<ShoppingListItem>
        {
            new() { Name = "First", SortOrder = 8 },
            new() { Name = "Second", SortOrder = 3 },
            new() { Name = "Third", SortOrder = 12 }
        };

        ShoppingListItemOrdering.Normalize(items);

        Assert.Equal([1000, 2000, 3000], items.Select(i => i.SortOrder));
        Assert.Equal(["First", "Second", "Third"], items.Select(i => i.Name));
    }
}
