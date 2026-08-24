import { formatCompactInputAmountParts } from '../lib/format';
import type { InputUnit } from '../types';

type MoneyValueProps = {
  inputUnit?: InputUnit;
  size?: 'summary' | 'card';
  value: number;
};

export function MoneyValue({ inputUnit = 'try', size = 'card', value }: MoneyValueProps) {
  const parts = formatCompactInputAmountParts(value, inputUnit);
  const unitText = [parts.scale, parts.suffix].filter(Boolean).join(' ');

  return (
    <span className={`money-value money-value--${size}`} title={parts.full}>
      <span className="money-value__amount">{parts.amount}</span>
      {unitText && <span className="money-value__unit">{unitText}</span>}
    </span>
  );
}
