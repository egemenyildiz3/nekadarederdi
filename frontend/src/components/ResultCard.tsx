import { ArrowUpRight, Info } from 'lucide-react';
import type { CalculationResult } from '../types';
import { formatMoney, numberFormatter } from '../lib/format';

type ResultCardProps = {
  result: CalculationResult;
};

export function ResultCard({ result }: ResultCardProps) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{result.series.name}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{result.series.description}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
          <ArrowUpRight aria-hidden="true" size={20} />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm text-slate-500">Yaklaşık karşılık</p>
        <p className="mt-1 text-3xl font-semibold tracking-normal text-slate-950">
          {formatMoney(result.resultAmount)}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-slate-500">Çarpan</p>
          <p className="mt-1 font-semibold text-slate-900">{numberFormatter.format(result.multiplier)}x</p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-slate-500">Birim</p>
          <p className="mt-1 font-semibold text-slate-900">{result.series.unit}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2 rounded-md bg-amber-50 p-3 text-sm leading-6 text-amber-900">
        <Info className="mt-0.5 shrink-0" aria-hidden="true" size={16} />
        <p>{result.series.sourceNote}</p>
      </div>
    </article>
  );
}
