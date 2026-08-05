using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using NekadarEderdi.Api.Models;

namespace NekadarEderdi.Api.Services;

public sealed class MarketDataStore : IMarketDataStore
{
    private const string CacheKey = "market-catalog";
    private readonly IWebHostEnvironment _environment;
    private readonly IMemoryCache _cache;

    public MarketDataStore(IWebHostEnvironment environment, IMemoryCache cache)
    {
        _environment = environment;
        _cache = cache;
    }

    public MarketCatalog GetCatalog()
    {
        return _cache.GetOrCreate(CacheKey, entry =>
        {
            entry.Priority = CacheItemPriority.NeverRemove;
            var path = Path.Combine(_environment.ContentRootPath, "Data", "market-series.json");
            using var stream = File.OpenRead(path);
            var catalog = JsonSerializer.Deserialize<MarketCatalog>(stream, JsonOptions());

            if (catalog is null || catalog.Series.Count == 0)
            {
                throw new InvalidOperationException("Veri dosyası boş veya okunamadı.");
            }

            return catalog;
        })!;
    }

    private static JsonSerializerOptions JsonOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        options.Converters.Add(new JsonStringEnumConverter<SeriesKey>(JsonNamingPolicy.CamelCase));
        return options;
    }
}
