using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using NekadarEderdi.Api.Models;
using NekadarEderdi.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:7573", "http://127.0.0.1:7573", "http://localhost:7180", "http://127.0.0.1:7180")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddMemoryCache();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { error = "Çok fazla istek gönderildi. Lütfen kısa bir süre sonra tekrar deneyin." },
            cancellationToken);
    };

    options.AddPolicy("Catalog", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(ClientKey(httpContext), _ => new FixedWindowRateLimiterOptions
        {
            AutoReplenishment = true,
            PermitLimit = 120,
            QueueLimit = 0,
            Window = TimeSpan.FromMinutes(1)
        }));

    options.AddPolicy("Calculate", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(ClientKey(httpContext), _ => new FixedWindowRateLimiterOptions
        {
            AutoReplenishment = true,
            PermitLimit = 60,
            QueueLimit = 0,
            Window = TimeSpan.FromMinutes(1)
        }));
});
builder.Services.AddSingleton<IMarketDataStore, MarketDataStore>();
builder.Services.AddSingleton<IValueCalculator, ValueCalculator>();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter<SeriesKey>(JsonNamingPolicy.CamelCase));
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter<InputUnit>(JsonNamingPolicy.CamelCase));
});
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("Frontend");
app.UseRateLimiter();

app.MapGet("/health", () => Results.Ok(new { ok = true }));

app.MapGet("/api/series", (IMarketDataStore dataStore) =>
{
    var catalog = dataStore.GetCatalog();
    return Results.Ok(catalog);
}).RequireRateLimiting("Catalog");

app.MapPost("/api/calculate", (CalculatorRequest request, IValueCalculator calculator) =>
{
    try
    {
        return Results.Ok(new CalculationResponse(calculator.Calculate(request)));
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message });
    }
}).RequireRateLimiting("Calculate");

app.Run();

static string ClientKey(HttpContext context)
{
    return context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
}
