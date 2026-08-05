using NekadarEderdi.Api.Models;

namespace NekadarEderdi.Api.Services;

public interface IMarketDataStore
{
    MarketCatalog GetCatalog();
}
