import { useEffect, useState } from 'react';
import { fetchSeries, fetchSpotMarket } from '../lib/api';
import { formatMoney, formatMonth } from '../lib/format';
import type { MarketCatalog, SpotMarket, SpotMarketItem } from '../types';

const REFRESH_MS = 5 * 60 * 1000;
const SPOT_DEFINITIONS: Record<SpotMarketItem['key'], Pick<SpotMarketItem, 'label' | 'unit'>> = {
  usd: { label: 'Dolar', unit: 'TL/USD' },
  eur: { label: 'Euro', unit: 'TL/EUR' },
  gold: { label: 'Gram altın', unit: 'TL/gr' },
  bitcoin: { label: 'Bitcoin', unit: 'TL/BTC' },
};
const SPOT_KEYS = Object.keys(SPOT_DEFINITIONS) as SpotMarketItem['key'][];
const FALLBACK_ITEMS: SpotMarket['items'] = [
  { key: 'usd', label: 'Dolar', value: Number.NaN, unit: 'TL/USD', source: 'Yükleniyor' },
  { key: 'eur', label: 'Euro', value: Number.NaN, unit: 'TL/EUR', source: 'Yükleniyor' },
  { key: 'gold', label: 'Gram altın', value: Number.NaN, unit: 'TL/gr', source: 'Yükleniyor' },
  { key: 'bitcoin', label: 'Bitcoin', value: Number.NaN, unit: 'TL/BTC', source: 'Yükleniyor' },
];

export function SpotMarketBar() {
  const [market, setMarket] = useState<SpotMarket | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const nextMarket = await fetchSpotMarket();

        if (!cancelled) {
          setMarket(nextMarket);
          setStatus('ready');
        }
      } catch {
        try {
          const catalog = await fetchSeries();
          const fallbackMarket = buildFallbackMarket(catalog);

          if (!cancelled) {
            setMarket(fallbackMarket);
            setStatus('fallback');
          }
        } catch {
          if (!cancelled) {
            setMarket(null);
            setStatus('error');
          }
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

  const items = market?.items ?? FALLBACK_ITEMS;

  return (
    <section className="ledger-card rounded-md border border-ink-100 px-4 py-3 shadow-soft" aria-label="Güncel piyasa özeti">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-data text-xs font-semibold uppercase text-oxide-700">Bugün</p>
          <p className="text-sm font-semibold text-ink-800">Kur, altın ve Bitcoin özeti</p>
        </div>
        <p className="text-xs text-ink-500">
          {status === 'ready' && market
            ? new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(market.updatedAt))
            : status === 'fallback'
              ? 'son aylık veri'
            : status === 'loading'
              ? 'yükleniyor'
              : 'şu an alınamadı'}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {items.map((item) => (
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
  if (!Number.isFinite(item.value)) {
    return '—';
  }

  return formatMoney(item.value);
}

function buildFallbackMarket(catalog: MarketCatalog): SpotMarket {
  return {
    updatedAt: catalog.updatedAt,
    source: 'Son aylık seri',
    items: SPOT_KEYS.map((key) => {
      const series = catalog.series.find((item) => item.key === key);
      const latest = [...(series?.observations ?? [])]
        .filter((observation) => Number.isFinite(observation.value))
        .sort((first, second) => second.date.localeCompare(first.date))[0];
      const definition = SPOT_DEFINITIONS[key];

      return {
        key,
        label: definition.label,
        value: latest?.value ?? Number.NaN,
        unit: series?.unit ?? definition.unit,
        source: latest ? `Son aylık seri: ${formatMonth(latest.date.slice(0, 7))}` : 'Veri yok',
      };
    }),
  };
}
