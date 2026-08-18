import { ArrowDownRight, ArrowUpRight, ChevronDown, Info } from 'lucide-react';
import { useState } from 'react';
import type { CalculationResult } from '../types';
import { formatMoney, formatMonth, numberFormatter } from '../lib/format';

type ResultCardProps = {
  result: CalculationResult;
};

export function ResultCard({ result }: ResultCardProps) {
  const TrendIcon = result.multiplier >= 1 ? ArrowUpRight : ArrowDownRight;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = `result-details-${result.series.key}`;

  return (
    <article className="ledger-card result-card rounded-md border border-ink-100 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-data text-xs font-semibold uppercase text-oxide-700">{result.series.shortName}</p>
          <h3 className="mt-1 text-lg font-bold text-ink-950">{result.series.name}</h3>
          <p className="mt-1 text-sm leading-6 text-ink-600">{result.series.description}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-oxide-100 bg-oxide-50 text-oxide-800">
          <TrendIcon aria-hidden="true" size={20} />
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-500">Yaklaşık karşılık</p>
          <button
            aria-controls={detailsId}
            aria-expanded={detailsOpen}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-ink-100 text-ink-700 transition hover:border-oxide-700 hover:text-oxide-800"
            title={detailsOpen ? 'Detayları gizle' : 'Detayları göster'}
            type="button"
            onClick={() => setDetailsOpen((current) => !current)}
          >
            <ChevronDown
              aria-hidden="true"
              className={`transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
              size={18}
            />
          </button>
        </div>
        <div className="value-stripe mt-1 rounded-md px-2 py-1">
          <p className="currency-value font-data font-bold tracking-normal text-ink-950">
            {formatMoney(result.resultAmount)}
          </p>
        </div>
      </div>

      {detailsOpen && (
        <div id={detailsId} className="mt-5 grid gap-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-ink-100 bg-paper-100/80 p-3">
              <p className="text-ink-500">Çarpan</p>
              <p className="mt-1 font-data font-semibold text-ink-900">{numberFormatter.format(result.multiplier)}x</p>
            </div>
            <div className="rounded-md border border-ink-100 bg-paper-100/80 p-3">
              <p className="text-ink-500">Birim</p>
              <p className="mt-1 font-data font-semibold text-ink-900">{result.series.unit}</p>
            </div>
            <div className="rounded-md border border-ink-100 bg-paper-100/80 p-3">
              <p className="text-ink-500">Başlangıç veri</p>
              <p className="mt-1 font-data font-semibold text-ink-900">
                {numberFormatter.format(result.startObservation.value)}
              </p>
              <p className="mt-1 text-xs text-ink-500">{formatMonth(result.startObservation.date.slice(0, 7))}</p>
            </div>
            <div className="rounded-md border border-ink-100 bg-paper-100/80 p-3">
              <p className="text-ink-500">Bitiş veri</p>
              <p className="mt-1 font-data font-semibold text-ink-900">
                {numberFormatter.format(result.endObservation.value)}
              </p>
              <p className="mt-1 text-xs text-ink-500">{formatMonth(result.endObservation.date.slice(0, 7))}</p>
            </div>
          </div>

          <div className="flex gap-2 rounded-md bg-coin-50 p-3 leading-6 text-ink-800">
            <Info className="mt-0.5 shrink-0" aria-hidden="true" size={16} />
            <p>{result.series.sourceNote}</p>
          </div>
        </div>
      )}
    </article>
  );
}
