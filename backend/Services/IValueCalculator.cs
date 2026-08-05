using NekadarEderdi.Api.Models;

namespace NekadarEderdi.Api.Services;

public interface IValueCalculator
{
    IReadOnlyList<CalculationResult> Calculate(CalculatorRequest request);
}
