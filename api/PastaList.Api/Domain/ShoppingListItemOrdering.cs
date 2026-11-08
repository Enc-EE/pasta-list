namespace PastaList.Api.Domain;

public static class ShoppingListItemOrdering
{
    public const int SortOrderGap = 1000;

    private const long MinimumSortOrder = -1_000_000_000;
    private const long MaximumSortOrder = 1_000_000_000;

    public static bool TryGetSortOrder(int? previousSortOrder, int? nextSortOrder, out int sortOrder)
    {
        long candidate;

        if (previousSortOrder is null)
        {
            candidate = nextSortOrder is int next
                ? (long)next - SortOrderGap
                : SortOrderGap;
        }
        else if (nextSortOrder is null)
        {
            candidate = (long)previousSortOrder.Value + SortOrderGap;
        }
        else
        {
            var previous = previousSortOrder.Value;
            var next = nextSortOrder.Value;
            if (previous >= next)
            {
                sortOrder = default;
                return false;
            }

            candidate = previous + ((long)next - previous) / 2;
            if (candidate <= previous || candidate >= next)
            {
                sortOrder = default;
                return false;
            }
        }

        if (candidate < MinimumSortOrder || candidate > MaximumSortOrder)
        {
            sortOrder = default;
            return false;
        }

        sortOrder = (int)candidate;
        return true;
    }

    public static void Normalize(IReadOnlyList<ShoppingListItem> items)
    {
        for (var index = 0; index < items.Count; index++)
        {
            items[index].SortOrder = checked((index + 1) * SortOrderGap);
        }
    }
}
