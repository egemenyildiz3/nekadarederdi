export const moneyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
});

export const preciseMoneyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 2,
});

export const numberFormatter = new Intl.NumberFormat('tr-TR', {
  maximumFractionDigits: 2,
});

const usdFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const eurFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
  if (Math.abs(value) < 1000) {
    return preciseMoneyFormatter.format(value);
  }

  return moneyFormatter.format(value);
}

export function formatInputAmount(value: number, inputUnit: 'try' | 'usd' | 'eur' | 'gold' | 'silver'): string {
  if (inputUnit === 'try') {
    return formatMoney(value);
  }

  if (inputUnit === 'usd') {
    return usdFormatter.format(value);
  }

  if (inputUnit === 'eur') {
    return eurFormatter.format(value);
  }

  const unitLabel = inputUnit === 'gold' ? 'gr altın' : 'gr gümüş';
  return `${numberFormatter.format(value)} ${unitLabel}`;
}

export function formatMonth(value: string): string {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  );
}
