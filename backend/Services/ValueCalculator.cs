using System.Text.RegularExpressions;
using NekadarEderdi.Api.Models;

namespace NekadarEderdi.Api.Services;

public sealed partial class ValueCalculator : IValueCalculator
{
    private static readonly DateOnly TlCutover = new(2005, 1, 1);
    private static readonly SeriesKey[] DefaultCriteria =
        [SeriesKey.Cpi, SeriesKey.Usd, SeriesKey.Gold, SeriesKey.MinimumWage];
    private readonly IMarketDataStore _marketDataStore;

    public ValueCalculator(IMarketDataStore marketDataStore)
    {
        _marketDataStore = marketDataStore;
    }

    public IReadOnlyList<CalculationResult> Calculate(CalculatorRequest request)
    {
        Validate(request);

        var catalog = _marketDataStore.GetCatalog();
        var criteria = request.Criteria is { Count: > 0 } ? request.Criteria.Distinct().ToArray() : DefaultCriteria;
        var startDate = ParseMonth(request.StartMonth);
        var endDate = ParseMonth(request.EndMonth);
        var appliedPre2005Conversion = startDate < TlCutover;
        var normalizedAmount = appliedPre2005Conversion ? request.Amount / 1_000_000m : request.Amount;

        return criteria.Select(key =>
        {
            var series = catalog.Series.FirstOrDefault(item => item.Key == key)
                ?? throw new ArgumentException($"'{key}' için veri serisi bulunamadı.");
            var startObservation = PickObservation(series.Observations, startDate);
            var endObservation = PickObservation(series.Observations, endDate);
            var multiplier = endObservation.Value / startObservation.Value;

            return new CalculationResult(
                new CalculationSeries(
                    series.Key,
                    series.Name,
                    series.ShortName,
                    series.Description,
                    series.Unit,
                    series.SourceNote),
                request.Amount,
                normalizedAmount,
                normalizedAmount * multiplier,
                multiplier,
                startObservation,
                endObservation,
                appliedPre2005Conversion);
        }).ToList();
    }

    private static MarketObservation PickObservation(IReadOnlyList<MarketObservation> observations, DateOnly month)
    {
        return observations
            .Where(item => item.Date <= month)
            .OrderByDescending(item => item.Date)
            .FirstOrDefault()
            ?? observations.OrderBy(item => item.Date).First();
    }

    private static void Validate(CalculatorRequest request)
    {
        if (request.Amount <= 0)
        {
            throw new ArgumentException("Miktar 0'dan büyük olmalı.");
        }

        if (!TryParseMonth(request.StartMonth, out _) || !TryParseMonth(request.EndMonth, out _))
        {
            throw new ArgumentException("Tarih formatı YYYY-MM olmalı ve ay 01-12 aralığında olmalı.");
        }
    }

    private static DateOnly ParseMonth(string value)
    {
        if (TryParseMonth(value, out var month))
        {
            return month;
        }

        throw new ArgumentException("Tarih formatı YYYY-MM olmalı ve ay 01-12 aralığında olmalı.");
    }

    private static bool TryParseMonth(string value, out DateOnly month)
    {
        month = default;

        if (!MonthRegex().IsMatch(value))
        {
            return false;
        }

        var parts = value.Split('-');
        return int.TryParse(parts[0], out var year)
            && int.TryParse(parts[1], out var monthNumber)
            && monthNumber is >= 1 and <= 12
            && DateOnly.TryParse($"{year:D4}-{monthNumber:D2}-01", out month);
    }

    [GeneratedRegex("^\\d{4}-\\d{2}$")]
    private static partial Regex MonthRegex();
}
