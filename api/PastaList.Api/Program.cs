using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using PastaList.Api.Data;
using PastaList.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// Connection string precedence: env var ConnectionStrings__PastaList > appsettings.*.json
var connectionString = builder.Configuration.GetConnectionString("PastaList")
    ?? throw new InvalidOperationException("Connection string 'PastaList' is not configured.");

builder.Services.AddDbContext<PastaListDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsql => npgsql.MigrationsHistoryTable("__ef_migrations_history", "pasta"));

    if (builder.Environment.IsDevelopment())
    {
        options.EnableDetailedErrors();
        options.EnableSensitiveDataLogging();
    }
});

builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

if (!builder.Environment.IsDevelopment())
{
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });
}

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseForwardedHeaders();
}

app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    // TODO: replace with an explicit migration step once a deployment pipeline exists.
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<PastaListDbContext>();
    await db.Database.MigrateAsync();
    await DevelopmentSeeder.SeedAsync(db);
}
else
{
    app.UseDefaultFiles();
    app.UseStaticFiles(new StaticFileOptions
    {
        OnPrepareResponse = context =>
        {
            var path = context.Context.Request.Path.Value ?? string.Empty;
            var cacheControl = path.StartsWith("/assets/", StringComparison.OrdinalIgnoreCase)
                ? "public, max-age=31536000, immutable"
                : "no-cache";

            context.Context.Response.Headers.CacheControl = cacheControl;
        }
    });
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" })).WithTags("System");

app.MapShoppingListEndpoints();
app.MapShoppingListItemEndpoints();

app.Map("/api/{**rest}", () => Results.Problem(
    statusCode: StatusCodes.Status404NotFound,
    title: "API endpoint not found."));

if (!app.Environment.IsDevelopment())
{
    app.MapFallbackToFile("index.html");
}

app.Run();

public partial class Program;
