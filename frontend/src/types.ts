export type SeriesKey =
  | 'cpi'
  | 'usd'
  | 'eur'
  | 'gold'
  | 'minimumWage'
  | 'silver'
  | 'bist100'
  | 'bitcoin'
  | 'housing'
  | 'gasoline'
  | 'deposit';
export type InputUnit = 'try' | 'usd' | 'eur' | 'gold' | 'silver';

export type Observation = {
  date: string;
  value: number;
};

export type MarketSeries = {
  key: SeriesKey;
  name: string;
  shortName: string;
  description: string;
  unit: string;
  sourceNote: string;
  observations: Observation[];
};

export type CalculationSeries = Omit<MarketSeries, 'observations'>;

export type MarketCatalog = {
  updatedAt: string;
  series: MarketSeries[];
};

export type CalculatorState = {
  amount: number;
  inputUnit: InputUnit;
  startMonth: string;
  endMonth: string;
  criteria: SeriesKey[];
};

export type CalculationResult = {
  series: CalculationSeries;
  originalAmount: number;
  normalizedAmount: number;
  resultAmount: number;
  multiplier: number;
  startObservation: Observation;
  endObservation: Observation;
  appliedPre2005Conversion: boolean;
};
