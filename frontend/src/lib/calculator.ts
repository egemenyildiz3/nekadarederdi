import type { CalculatorState, InputUnit, SeriesKey } from '../types';

const VALID_CRITERIA: SeriesKey[] = ['cpi', 'usd', 'eur', 'gold', 'minimumWage', 'silver'];
const DEFAULT_CRITERIA: SeriesKey[] = ['cpi', 'usd', 'gold', 'minimumWage'];
const VALID_INPUT_UNITS: InputUnit[] = ['try', 'usd', 'eur', 'gold', 'silver'];

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function defaultState(): CalculatorState {
  return {
    amount: 10000,
    inputUnit: 'try',
    startMonth: '2010-01',
    endMonth: currentMonth(),
    criteria: DEFAULT_CRITERIA,
  };
}

export function parseStateFromUrl(search: string): CalculatorState {
  const fallback = defaultState();
  const params = new URLSearchParams(search);
  const amount = Number(params.get('amount'));
  const inputUnit = normalizeInputUnit(params.get('unit')) ?? fallback.inputUnit;
  const criteria = params
    .get('criteria')
    ?.split(',')
    .filter((key): key is SeriesKey => VALID_CRITERIA.includes(key as SeriesKey));

  return {
    amount: Number.isFinite(amount) && amount > 0 ? amount : fallback.amount,
    inputUnit,
    startMonth: normalizeMonth(params.get('start')) ?? fallback.startMonth,
    endMonth: normalizeMonth(params.get('end')) ?? fallback.endMonth,
    criteria: criteria?.length ? criteria : fallback.criteria,
  };
}

export function stateToSearchParams(state: CalculatorState): string {
  const params = new URLSearchParams();
  params.set('amount', String(state.amount));
  params.set('unit', state.inputUnit);
  params.set('start', state.startMonth);
  params.set('end', state.endMonth);
  params.set('criteria', state.criteria.join(','));
  return params.toString();
}

export function isDefaultState(state: CalculatorState): boolean {
  const fallback = defaultState();
  return (
    state.amount === fallback.amount &&
    state.inputUnit === fallback.inputUnit &&
    state.startMonth === fallback.startMonth &&
    state.endMonth === fallback.endMonth &&
    sameCriteria(state.criteria, fallback.criteria)
  );
}

function normalizeInputUnit(value: string | null): InputUnit | null {
  return value && VALID_INPUT_UNITS.includes(value as InputUnit) ? (value as InputUnit) : null;
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
