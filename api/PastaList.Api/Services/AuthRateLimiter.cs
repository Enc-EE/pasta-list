using System.Collections.Concurrent;

namespace PastaList.Api.Services;

public class AuthRateLimiter
{
    private readonly ConcurrentDictionary<string, Queue<DateTimeOffset>> windows = new();

    public bool TryAllowEmailRequest(string email)
    {
        return TryAllow($"email:{email}", 3, TimeSpan.FromMinutes(15));
    }

    private bool TryAllow(string key, int limit, TimeSpan window)
    {
        var now = DateTimeOffset.UtcNow;
        var timestamps = windows.GetOrAdd(key, _ => new Queue<DateTimeOffset>());

        lock (timestamps)
        {
            while (timestamps.Count > 0 && now - timestamps.Peek() >= window)
            {
                timestamps.Dequeue();
            }

            if (timestamps.Count >= limit)
            {
                return false;
            }

            timestamps.Enqueue(now);
            return true;
        }
    }
}
