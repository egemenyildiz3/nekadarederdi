import type { CalculatorState, SeriesKey } from '../types';

const VALID_CRITERIA: SeriesKey[] = ['tl', 'cpi', 'usd', 'eur', 'gold', 'minimumWage', 'silver'];
const DEFAULT_CRITERIA: SeriesKey[] = ['tl', 'cpi', 'usd', 'gold'];

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
    .filter((key): key is SeriesKey => VALID_CRITERIA.includes(key as SeriesKey));

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

export function isDefaultState(state: CalculatorState): boolean {
  const fallback = defaultState();
  return (
    state.amount === fallback.amount &&
    state.startMonth === fallback.startMonth &&
    state.endMonth === fallback.endMonth &&
    sameCriteria(state.criteria, fallback.criteria)
  );
}

function sameCriteria(first: SeriesKey[], second: SeriesKey[]): boolean {
  return first.length === second.length && first.every((item, index) => item === second[index]);
}

function normalizeMonth(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12 ? value : null;
}
