using System.Text.RegularExpressions;
using NekadarEderdi.Api.Models;

namespace NekadarEderdi.Api.Services;

public sealed partial class ValueCalculator : IValueCalculator
{
    private static readonly DateOnly TlCutover = new(2005, 1, 1);
    private static readonly SeriesKey[] DefaultCriteria = [SeriesKey.Cpi, SeriesKey.Usd, SeriesKey.Gold];
    private readonly IMarketDataStore _marketDataStore;

    public ValueCalculator(IMarketDataStore marketDataStore)
    {
        _marketDataStore = marketDataStore;
    }

    public IReadOnlyList<CalculationResult> Calculate(CalculatorRequest request)
    {
        Validate(request);

        var catalog = _marketDataStore.GetCatalog();
        var criteria = request.Criteria.Count > 0 ? request.Criteria.Distinct().ToArray() : DefaultCriteria;
        var startDate = ParseMonth(request.StartMonth);
        var endDate = ParseMonth(request.EndMonth);
        var appliedPre2005Conversion = startDate < TlCutover;
        var normalizedAmount = appliedPre2005Conversion ? request.Amount / 1_000_000m : request.Amount;

        return criteria.Select(key =>
        {
            var series = catalog.Series.First(item => item.Key == key);
            var startObservation = PickObservation(series.Observations, startDate);
            var endObservation = PickObservation(series.Observations, endDate);
            var multiplier = endObservation.Value / startObservation.Value;

            return new CalculationResult(
                series,
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

        if (!MonthRegex().IsMatch(request.StartMonth) || !MonthRegex().IsMatch(request.EndMonth))
        {
            throw new ArgumentException("Tarih formatı YYYY-MM olmalı.");
        }

        if (ParseMonth(request.EndMonth) < ParseMonth(request.StartMonth))
        {
            throw new ArgumentException("Bitiş tarihi başlangıç tarihinden önce olamaz.");
        }
    }

    private static DateOnly ParseMonth(string value)
    {
        var parts = value.Split('-');
        return new DateOnly(int.Parse(parts[0]), int.Parse(parts[1]), 1);
    }

    [GeneratedRegex("^\\d{4}-\\d{2}$")]
    private static partial Regex MonthRegex();
}
