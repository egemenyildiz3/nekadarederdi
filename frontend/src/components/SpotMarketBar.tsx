import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchSpotMarket } from '../lib/api';
import { formatMoney, numberFormatter } from '../lib/format';
import type { SpotMarket } from '../types';

const REFRESH_MS = 5 * 60 * 1000;

export function SpotMarketBar() {
  const [market, setMarket] = useState<SpotMarket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const nextMarket = await fetchSpotMarket();

        if (!cancelled) {
          setMarket(nextMarket);
        }
      } catch {
        if (!cancelled) {
          setMarket(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    const interval = window.setInterval(load, REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <section className="ledger-card flex min-h-16 items-center justify-center rounded-md border border-ink-100 px-4 py-3 text-sm text-ink-500 shadow-soft">
        <Loader2 aria-hidden="true" className="mr-2 animate-spin text-oxide-700" size={16} />
        Güncel piyasa verileri yükleniyor
      </section>
    );
  }

  if (!market) {
    return null;
  }

  return (
    <section className="ledger-card rounded-md border border-ink-100 px-4 py-3 shadow-soft" aria-label="Güncel piyasa özeti">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-data text-xs font-semibold uppercase text-oxide-700">Bugün</p>
          <p className="text-sm font-semibold text-ink-800">Kur, altın ve Bitcoin özeti</p>
        </div>
        <p className="text-xs text-ink-500">
          {new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(market.updatedAt))}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {market.items.map((item) => (
          <div className="rounded-md border border-ink-100 bg-white/75 p-3" key={item.key} title={item.source}>
            <p className="text-xs font-semibold text-ink-500">{item.label}</p>
            <p className="mt-1 font-data text-base font-extrabold text-ink-950">{formatSpotValue(item)}</p>
            <p className="mt-1 text-[11px] text-ink-500">{item.unit}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatSpotValue(item: SpotMarket['items'][number]) {
  if (item.key === 'usd' || item.key === 'eur' || item.key === 'gold' || item.key === 'bitcoin') {
    return formatMoney(item.value);
  }

  return numberFormatter.format(item.value);
}
