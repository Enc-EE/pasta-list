using PastaList.Api.Services;

namespace PastaList.Api.Tests;

public class RateLimiterTests
{
    [Fact]
    public void EmailRequests_AreLimitedToThreePerWindow()
    {
        var limiter = new AuthRateLimiter();

        Assert.True(limiter.TryAllowEmailRequest("person@example.com"));
        Assert.True(limiter.TryAllowEmailRequest("person@example.com"));
        Assert.True(limiter.TryAllowEmailRequest("person@example.com"));
        Assert.False(limiter.TryAllowEmailRequest("person@example.com"));
    }

    [Fact]
    public void EmailRateLimit_IsPartitionedByEmail()
    {
        var limiter = new AuthRateLimiter();

        Assert.True(limiter.TryAllowEmailRequest("first@example.com"));
        Assert.True(limiter.TryAllowEmailRequest("second@example.com"));
    }
}
