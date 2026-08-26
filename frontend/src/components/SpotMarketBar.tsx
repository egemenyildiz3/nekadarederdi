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
    <section className="spot-strip" aria-label="Güncel piyasa özeti">
      <div className="spot-strip__head">
        <div>
          <p className="eyebrow">Bugün</p>
          <p>Kur, altın ve Bitcoin özeti</p>
        </div>
        <p>
          {status === 'fallback'
            ? 'son aylık veri'
            : status === 'loading'
              ? 'yükleniyor'
              : status === 'error'
                ? 'şu an alınamadı'
                : null}
        </p>
      </div>
      <div className="spot-strip__items">
        {items.map((item) => (
          <div className="spot-item" key={item.key} title={item.source}>
            <p>{item.label}</p>
            <strong>{formatSpotValue(item)}</strong>
            <span className="spot-item__meta">
              <span>{item.unit}</span>
              <SpotChange item={item} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatSpotValue(item: SpotMarket['items'][number]) {
  if (!Number.isFinite(item.value)) {
    return '-';
  }

  return formatMoney(item.value);
}

function SpotChange({ item }: { item: SpotMarketItem }) {
  const changePercent = item.changePercent;

  if (typeof changePercent !== 'number' || !Number.isFinite(changePercent)) {
    return null;
  }

  const direction = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat';
  const sign = changePercent > 0 ? '+' : '';

  return (
    <span className="spot-change" data-direction={direction} aria-label={`Önceki veriye göre ${formatSpotChange(changePercent)}`}>
      <span aria-hidden="true">{direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→'}</span>
      {sign}
      {formatSpotChange(changePercent)}
    </span>
  );
}

function formatSpotChange(value: number) {
  return `${new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)}%`;
}

function buildFallbackMarket(catalog: MarketCatalog): SpotMarket {
  return {
    updatedAt: catalog.updatedAt,
    source: 'Son aylık seri',
    items: SPOT_KEYS.map((key) => {
      const series = catalog.series.find((item) => item.key === key);
      const observations = [...(series?.observations ?? [])]
        .filter((observation) => Number.isFinite(observation.value))
        .sort((first, second) => second.date.localeCompare(first.date));
      const latest = observations[0];
      const previous = observations[1];
      const definition = SPOT_DEFINITIONS[key];
      const changePercent =
        latest && previous && previous.value
          ? ((latest.value - previous.value) / previous.value) * 100
          : null;

      return {
        key,
        label: definition.label,
        value: latest?.value ?? Number.NaN,
        previousValue: previous?.value ?? null,
        changePercent,
        unit: series?.unit ?? definition.unit,
        source: latest ? `Son aylık seri: ${formatMonth(latest.date.slice(0, 7))}` : 'Veri yok',
      };
    }),
  };
}
