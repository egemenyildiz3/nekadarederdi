using System.Text.Json.Serialization;

namespace NekadarEderdi.Api.Models;

[JsonConverter(typeof(JsonStringEnumConverter<SeriesKey>))]
public enum SeriesKey
{
    // Temel Makro Göstergeler
    Cpi,            // Enflasyon / TÜFE (TL Alım Gücü)
    MinimumWage,    // Asgari Ücret Oranı

    // Döviz
    Usd,            // Amerikan Doları
    Eur,            // Euro

    // Emtia
    Gold,           // Gram Altın
    Silver,         // Gram Gümüş
    // Fuel,           // Benzin / Motorin (Opsiyonel)

     // Yatırım Araçları
    // Bist100,        // Borsa İstanbul (Opsiyonel)
    // Housing,        // Konut Fiyat Endeksi (Opsiyonel)
    // DepositInterest // Mevduat Faizi (Opsiyonel)
}

[JsonConverter(typeof(JsonStringEnumConverter<InputUnit>))]
public enum InputUnit
{
    Try,
    Usd,
    Eur,
    Gold,
    Silver
}

public sealed record MarketCatalog(
    DateOnly UpdatedAt,
    IReadOnlyList<MarketSeries> Series);

public sealed record MarketSeries(
    SeriesKey Key,
    string Name,
    string ShortName,
    string Description,
    string Unit,
    string SourceNote,
    IReadOnlyList<MarketObservation> Observations);

public sealed record MarketObservation(
    DateOnly Date,
    decimal Value);

public sealed record CalculationSeries(
    SeriesKey Key,
    string Name,
    string ShortName,
    string Description,
    string Unit,
    string SourceNote);

public sealed record CalculatorRequest(
    decimal Amount,
    InputUnit InputUnit,
    string StartMonth,
    string EndMonth,
    IReadOnlyList<SeriesKey> Criteria);

public sealed record CalculationResponse(
    IReadOnlyList<CalculationResult> Results);

public sealed record CalculationResult(
    CalculationSeries Series,
    decimal OriginalAmount,
    decimal NormalizedAmount,
    decimal ResultAmount,
    decimal Multiplier,
    MarketObservation StartObservation,
    MarketObservation EndObservation,
    bool AppliedPre2005Conversion);
