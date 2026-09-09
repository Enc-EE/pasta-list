using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using PastaList.Api.Contracts;
using PastaList.Api.Data;
using PastaList.Api.Domain;
using PastaList.Api.Services;

namespace PastaList.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Authentication");

        group.MapPost("/request-code", RequestCode)
            .WithName("RequestLoginCode")
            .RequireRateLimiting("auth-request-ip");
        group.MapPost("/verify", VerifyCode)
            .WithName("VerifyLoginCode")
            .RequireRateLimiting("auth-verify-ip");
        group.MapPost("/logout", Logout)
            .WithName("Logout")
            .RequireAuthorization();
        group.MapGet("/me", GetCurrentUser)
            .WithName("GetCurrentUser")
            .RequireAuthorization();

        return app;
    }

    private static async Task<IResult> RequestCode(
        RequestLoginCodeRequest request,
        HttpContext httpContext,
        LoginCodeService loginCodeService,
        AuthRateLimiter authRateLimiter,
        IVerificationEmailSender emailSender,
        CancellationToken cancellationToken)
    {
        var email = EmailAddressNormalizer.Normalize(request.Email);
        if (email is null)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["email"] = ["Enter a valid email address."]
            });
        }

        if (!authRateLimiter.TryAllowEmailRequest(email))
        {
            return Results.StatusCode(StatusCodes.Status429TooManyRequests);
        }

        var code = await loginCodeService.CreateAsync(
            email,
            httpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken);
        await emailSender.SendAsync(email, code, cancellationToken);

        return Results.Accepted();
    }

    private static async Task<IResult> VerifyCode(
        VerifyLoginCodeRequest request,
        HttpContext httpContext,
        LoginCodeService loginCodeService,
        PastaListDbContext db,
        CancellationToken cancellationToken)
    {
        var email = EmailAddressNormalizer.Normalize(request.Email);
        if (email is null || request.Code.Length != 6 || !request.Code.All(char.IsDigit))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["code"] = ["Enter the six-digit verification code."]
            });
        }

        var result = await loginCodeService.VerifyAsync(email, request.Code, cancellationToken);
        if (result is not LoginCodeVerificationResult.Success)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "The verification code is invalid or expired.");
        }

        var user = await db.Users.FirstOrDefaultAsync(item => item.Email == email, cancellationToken);
        if (user is null)
        {
            user = new User { Email = email };
            db.Users.Add(user);
        }

        user.LastLoginAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("security_stamp", user.SecurityStamp)
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            claims,
            CookieAuthenticationDefaults.AuthenticationScheme));

        await httpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal);

        return Results.Ok(new CurrentUserDto(user.Id, user.Email, user.CreatedAt, user.LastLoginAt));
    }

    private static async Task<IResult> Logout(
        HttpContext httpContext,
        PastaListDbContext db,
        CancellationToken cancellationToken)
    {
        var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(userId, out var parsedUserId))
        {
            var user = await db.Users.FirstOrDefaultAsync(item => item.Id == parsedUserId, cancellationToken);
            if (user is not null)
            {
                user.SecurityStamp = Guid.NewGuid().ToString("N");
                await db.SaveChangesAsync(cancellationToken);
            }
        }

        await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Results.NoContent();
    }

    private static async Task<IResult> GetCurrentUser(
        ClaimsPrincipal principal,
        PastaListDbContext db,
        CancellationToken cancellationToken)
    {
        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userId, out var parsedUserId))
        {
            return Results.Unauthorized();
        }

        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(item => item.Id == parsedUserId, cancellationToken);
        return user is null
            ? Results.Unauthorized()
            : Results.Ok(new CurrentUserDto(user.Id, user.Email, user.CreatedAt, user.LastLoginAt));
    }
}
