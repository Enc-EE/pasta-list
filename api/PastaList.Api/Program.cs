using Microsoft.EntityFrameworkCore;
using PastaList.Api.Data;
using PastaList.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicy = "PastaListWeb";

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

builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? ["http://localhost:5173"];

    options.AddPolicy(CorsPolicy, policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

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
    app.UseHttpsRedirection();
}

app.UseCors(CorsPolicy);

app.MapGet("/health", () => Results.Ok(new { status = "ok" })).WithTags("System");

app.MapShoppingListEndpoints();
app.MapShoppingListItemEndpoints();

app.Run();

public partial class Program;
