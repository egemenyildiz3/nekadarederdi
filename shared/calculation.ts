import type { CalculatorState, CalculationResult, MarketCatalog, MarketSeries, SeriesKey } from '../frontend/src/types';

export const DEFAULT_CRITERIA: SeriesKey[] = ['cpi', 'usd', 'gold', 'minimumWage'];
export const MAX_INPUT_AMOUNT = 999_999_999_999;

export function latestCommonMonth(catalog: MarketCatalog, criteria: SeriesKey[]): string | null {
  const series = criteria.map(key => catalog.series.find(item => item.key === key));
  if (!series.length || series.some(item => !item)) return null;
  const months = series.map(item => new Set(item!.observations.filter(row => row.value > 0 && Number.isFinite(row.value)).map(row => row.date.slice(0, 7))));
  return [...months[0]].filter(month => months.every(set => set.has(month))).sort().at(-1) ?? null;
}

function observation(series: MarketSeries, month: string) {
  const row = series.observations.find(item => item.date.slice(0, 7) === month);
  if (!row || !Number.isFinite(row.value) || row.value <= 0) {
    const first = series.observations[0]?.date.slice(0, 7);
    const last = series.observations.at(-1)?.date.slice(0, 7);
    throw new Error(`${series.name}: ${month} için veri yok. Mevcut kapsam ${first} – ${last}. Tarihi veya ölçütü değiştirin.`);
  }
  return row;
}

export function calculate(catalog: MarketCatalog, request: Partial<CalculatorState>): CalculationResult[] {
  if (!request || typeof request !== 'object') throw new Error('Geçerli bir hesaplama girin.');
  const { amount, startMonth, endMonth } = request;
  const inputUnit = request.inputUnit ?? 'try';
  if (!Number.isFinite(amount) || !amount || amount <= 0 || amount > MAX_INPUT_AMOUNT) throw new Error('Miktar 0 ile 999.999.999.999 arasında olmalı.');
  if (![startMonth, endMonth].every(value => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value))) throw new Error('Tarih formatı YYYY-MM olmalı.');
  if (!['try', 'usd', 'eur', 'gold', 'silver'].includes(inputUnit)) throw new Error('Girdi birimi desteklenmiyor.');
  if (request.criteria !== undefined && (!Array.isArray(request.criteria) || request.criteria.length === 0 || request.criteria.length > 11)) throw new Error('En az bir geçerli ölçüt seçin.');
  const keys = [...new Set(request.criteria ?? DEFAULT_CRITERIA)];
  const selected = keys.map(key => {
    const series = catalog.series.find(item => item.key === key);
    if (!series) throw new Error(`'${key}' için veri serisi bulunamadı.`);
    return series;
  });
  let normalizedAmount = amount;
  if (inputUnit !== 'try') {
    const inputSeries = catalog.series.find(item => item.key === inputUnit);
    if (!inputSeries) throw new Error('Girdi birimi için veri yok.');
    normalizedAmount *= observation(inputSeries, startMonth!).value;
  }
  return selected.map(({ observations, ...series }) => {
    const fullSeries = { ...series, observations };
    const startObservation = observation(fullSeries, startMonth!);
    const endObservation = observation(fullSeries, endMonth!);
    const multiplier = endObservation.value / startObservation.value;
    return { series, originalAmount: amount, normalizedAmount, resultAmount: normalizedAmount * multiplier, multiplier, startObservation, endObservation, appliedPre2005Conversion: false };
  });
}
