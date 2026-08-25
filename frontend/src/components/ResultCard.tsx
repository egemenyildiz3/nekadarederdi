import { ChevronDown, Info } from 'lucide-react';
import { useState } from 'react';
import type { CalculationResult } from '../types';
import { MoneyValue } from './MoneyValue';
import { formatMoney, formatMonth, numberFormatter } from '../lib/format';

type ResultCardProps = {
  result: CalculationResult;
};

export function ResultCard({ result }: ResultCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = `result-details-${result.series.key}`;
  const direction = result.multiplier >= 1 ? 'up' : 'down';

  return (
    <article className="result-row" data-direction={direction}>
      <div className="result-row__measure">
        <p>{result.series.shortName}</p>
        <h3>{result.series.name}</h3>
      </div>

      <div className="result-row__value">
        <MoneyValue minCompactValue={100_000} value={result.resultAmount} />
        <span>{formatMoney(result.resultAmount)}</span>
      </div>

      <div className="result-row__multiplier">
        <span>{numberFormatter.format(result.multiplier)}x</span>
      </div>

      <button
        aria-controls={detailsId}
        aria-expanded={detailsOpen}
        className="result-row__toggle"
        title={detailsOpen ? 'Detayları gizle' : 'Detayları göster'}
        type="button"
        onClick={() => setDetailsOpen((current) => !current)}
      >
        <ChevronDown aria-hidden="true" className={detailsOpen ? 'rotate-180' : ''} size={18} />
      </button>

      {detailsOpen && (
        <div id={detailsId} className="result-row__details">
          <p className="result-row__description">{result.series.description}</p>
          <dl className="result-metadata">
            <div>
              <dt>Tam karşılık</dt>
              <dd>{formatMoney(result.resultAmount)}</dd>
            </div>
            <div>
              <dt>Birim</dt>
              <dd>{result.series.unit}</dd>
            </div>
            <div>
              <dt>Başlangıç veri</dt>
              <dd>{numberFormatter.format(result.startObservation.value)}</dd>
              <small>{formatMonth(result.startObservation.date.slice(0, 7))}</small>
            </div>
            <div>
              <dt>Bitiş veri</dt>
              <dd>{numberFormatter.format(result.endObservation.value)}</dd>
              <small>{formatMonth(result.endObservation.date.slice(0, 7))}</small>
            </div>
          </dl>
          <div className="source-note">
            <Info aria-hidden="true" size={16} />
            <p>{result.series.sourceNote}</p>
          </div>
        </div>
      )}
    </article>
  );
}
