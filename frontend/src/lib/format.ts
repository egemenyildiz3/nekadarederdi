export const moneyFormatter = new Intl.NumberFormat('tr-TR', {
  maximumFractionDigits: 0,
});

export const preciseMoneyFormatter = new Intl.NumberFormat('tr-TR', {
  maximumFractionDigits: 2,
});

export const numberFormatter = new Intl.NumberFormat('tr-TR', {
  maximumFractionDigits: 2,
});

export const editableNumberFormatter = new Intl.NumberFormat('tr-TR', {
  maximumFractionDigits: 8,
});

const compactMoneyUnits = [
  { value: 1_000_000_000_000_000_000, label: 'kentilyon' },
  { value: 1_000_000_000_000_000, label: 'katrilyon' },
  { value: 1_000_000_000_000, label: 'trilyon' },
  { value: 1_000_000_000, label: 'milyar' },
  { value: 1_000_000, label: 'milyon' },
  { value: 1_000, label: 'bin' },
];

export type CompactAmountParts = {
  amount: string;
  scale: string;
  suffix: string;
  full: string;
};

export function formatMoney(value: number): string {
  return `${formatTryNumber(value)}₺`;
}

export function formatCompactMoney(value: number): string {
  return partsToText(formatCompactInputAmountParts(value, 'try'));
}

export function formatCompactInputAmountParts(
  value: number,
  inputUnit: 'try' | 'usd' | 'eur' | 'gold' | 'silver',
  minCompactValue = 1_000_000,
): CompactAmountParts {
  const suffix =
    inputUnit === 'try'
      ? '₺'
      : inputUnit === 'usd'
        ? '$'
      : inputUnit === 'eur'
        ? '€'
      : inputUnit === 'gold'
        ? 'gr altın'
      : 'gr gümüş';

  return {
    ...formatCompactNumberParts(value, minCompactValue),
    suffix,
    full: formatFullInputAmount(value, inputUnit),
  };
}

function formatCompactNumberParts(value: number, minCompactValue: number): Pick<CompactAmountParts, 'amount' | 'scale'> {
  const absoluteValue = Math.abs(value);
  const unit = compactMoneyUnits.find((item) => absoluteValue >= item.value);

  if (!unit || absoluteValue < minCompactValue) {
    return { amount: formatTryNumber(value), scale: '' };
  }

  return { amount: preciseMoneyFormatter.format(value / unit.value), scale: unit.label };
}

export function formatTryNumber(value: number): string {
  if (hasFraction(value) || Math.abs(value) < 1000) {
    return preciseMoneyFormatter.format(value);
  }

  return moneyFormatter.format(value);
}

function hasFraction(value: number): boolean {
  return Math.abs(value - Math.round(value)) >= 0.005;
}

export function formatInputAmount(value: number, inputUnit: 'try' | 'usd' | 'eur' | 'gold' | 'silver'): string {
  return partsToText(formatCompactInputAmountParts(value, inputUnit));
}

function formatFullInputAmount(value: number, inputUnit: 'try' | 'usd' | 'eur' | 'gold' | 'silver'): string {
  if (inputUnit === 'try') {
    return formatMoney(value);
  }

  if (inputUnit === 'usd') {
    return `${formatTryNumber(value)}$`;
  }

  if (inputUnit === 'eur') {
    return `${formatTryNumber(value)}€`;
  }

  const unitLabel = inputUnit === 'gold' ? 'gr altın' : 'gr gümüş';
  return `${formatTryNumber(value)} ${unitLabel}`;
}

function partsToText(parts: CompactAmountParts): string {
  return [parts.amount, parts.scale, parts.suffix].filter(Boolean).join(' ');
}

export function formatEditableNumber(value: number): string {
  return Number.isFinite(value) && value > 0 ? editableNumberFormatter.format(value) : '';
}

export function parseLocalizedNumber(value: string): number {
  const normalized = value.trim().replace(/\s/g, '');

  if (!normalized) {
    return Number.NaN;
  }

  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');
  let numeric = normalized;

  if (lastComma >= 0 && lastDot >= 0) {
    numeric =
      lastDot > lastComma
        ? normalized.replace(/,/g, '')
        : normalized.replace(/\./g, '').replace(',', '.');
  } else if (lastComma >= 0) {
    numeric = normalized.replace(/\./g, '').replace(',', '.');
  } else if (lastDot >= 0) {
    const groups = normalized.split('.');
    const looksGrouped = groups.length > 1 && groups.slice(1).every((group) => group.length === 3);
    numeric = looksGrouped ? groups.join('') : normalized;
  }

  return Number(numeric);
}

export function formatMonth(value: string): string {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  );
}
