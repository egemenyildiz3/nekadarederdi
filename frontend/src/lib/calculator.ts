import type { CalculatorState, SeriesKey } from '../types';

const DEFAULT_CRITERIA: SeriesKey[] = ['cpi', 'usd', 'gold'];

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function defaultState(): CalculatorState {
  return {
    amount: 10000,
    startMonth: '2010-01',
    endMonth: currentMonth(),
    criteria: DEFAULT_CRITERIA,
  };
}

export function parseStateFromUrl(search: string): CalculatorState {
  const fallback = defaultState();
  const params = new URLSearchParams(search);
  const amount = Number(params.get('amount'));
  const criteria = params
    .get('criteria')
    ?.split(',')
    .filter(Boolean) as SeriesKey[] | undefined;

  return {
    amount: Number.isFinite(amount) && amount > 0 ? amount : fallback.amount,
    startMonth: normalizeMonth(params.get('start')) ?? fallback.startMonth,
    endMonth: normalizeMonth(params.get('end')) ?? fallback.endMonth,
    criteria: criteria?.length ? criteria : fallback.criteria,
  };
}

export function stateToSearchParams(state: CalculatorState): string {
  const params = new URLSearchParams();
  params.set('amount', String(state.amount));
  params.set('start', state.startMonth);
  params.set('end', state.endMonth);
  params.set('criteria', state.criteria.join(','));
  return params.toString();
}

function normalizeMonth(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  return value;
}
