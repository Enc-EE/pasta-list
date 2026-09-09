using Microsoft.AspNetCore.Mvc;

namespace PastaList.Api.Middleware;

public class SameOriginMiddleware(
    RequestDelegate next,
    IConfiguration configuration)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments("/api") &&
            context.Request.Method is not ("GET" or "HEAD" or "OPTIONS") &&
            !IsAllowedOrigin(context))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Cross-origin request rejected."
            });
            return;
        }

        await next(context);
    }

    private bool IsAllowedOrigin(HttpContext context)
    {
        var origin = context.Request.Headers.Origin.ToString();
        if (string.IsNullOrWhiteSpace(origin))
        {
            return false;
        }

        var requestOrigin = $"{context.Request.Scheme}://{context.Request.Host}";
        if (string.Equals(origin, requestOrigin, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var allowedOrigins = configuration.GetSection("Security:AllowedOrigins").Get<string[]>() ?? [];
        return allowedOrigins.Any(allowed => string.Equals(allowed, origin, StringComparison.OrdinalIgnoreCase));
    }
}
