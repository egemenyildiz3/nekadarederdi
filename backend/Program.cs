using System.Text.Json;
using System.Text.Json.Serialization;
using NekadarEderdi.Api.Models;
using NekadarEderdi.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IMarketDataStore, MarketDataStore>();
builder.Services.AddSingleton<IValueCalculator, ValueCalculator>();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter<SeriesKey>(JsonNamingPolicy.CamelCase));
});
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("Frontend");

app.MapGet("/health", () => Results.Ok(new { ok = true }));

app.MapGet("/api/series", (IMarketDataStore dataStore) =>
{
    var catalog = dataStore.GetCatalog();
    return Results.Ok(catalog);
});

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
});

app.Run();
