import { formatCompactInputAmountParts } from '../lib/format';
import type { InputUnit } from '../types';

type MoneyValueProps = {
  inputUnit?: InputUnit;
  size?: 'summary' | 'card';
  value: number;
};

export function MoneyValue({ inputUnit = 'try', size = 'card', value }: MoneyValueProps) {
  const parts = formatCompactInputAmountParts(value, inputUnit);

  return (
    <span className={`money-value money-value--${size}`} title={parts.full}>
      <span className="money-value__amount">{parts.amount}</span>
      {(parts.scale || parts.suffix) && (
        <span className="money-value__unit">
          {parts.scale && <span className="money-value__scale">{parts.scale}</span>}
          {parts.suffix && <span className="money-value__symbol">{parts.suffix}</span>}
        </span>
      )}
    </span>
  );
}
