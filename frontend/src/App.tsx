import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Loader2, RotateCcw } from 'lucide-react';
import { AdSlot } from './components/AdSlot';
import { Logo } from './components/Logo';
import { MonthSelect } from './components/MonthSelect';
import { ResultCard } from './components/ResultCard';
import { calculateOnBackend, fetchSeries } from './lib/api';
import { defaultState, isDefaultState, parseStateFromUrl, stateToSearchParams } from './lib/calculator';
import { formatMoney, formatMonth } from './lib/format';
import type { CalculationResult, CalculatorState, MarketCatalog, SeriesKey } from './types';

const CRITERIA: { key: SeriesKey; label: string; hint: string }[] = [
  { key: 'tl', label: 'TL', hint: 'Nominal' },
  { key: 'cpi', label: 'TÜFE', hint: 'Alım gücü' },
  { key: 'usd', label: 'USD', hint: 'Dolar' },
  { key: 'eur', label: 'EUR', hint: 'Euro' },
  { key: 'gold', label: 'Altın', hint: 'Gram' },
  { key: 'minimumWage', label: 'Asgari ücret', hint: 'Net' },
  { key: 'silver', label: 'Gümüş', hint: 'Gram' },
];

function App() {
  const [state, setState] = useState<CalculatorState>(() => parseStateFromUrl(window.location.search));
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [catalog, setCatalog] = useState<MarketCatalog | null>(null);
  const [debouncedState, setDebouncedState] = useState(state);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSeries()
      .then((nextCatalog) => setCatalog(nextCatalog))
      .catch(() => setError('Veri listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.'));
  }, []);

  useEffect(() => {
    const query = isDefaultState(state) ? '' : `?${stateToSearchParams(state)}`;
    const nextUrl = `${window.location.pathname}${query}`;
    window.history.replaceState(null, '', nextUrl);
  }, [state]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedState(state), 220);
    return () => window.clearTimeout(timeout);
  }, [state]);

  useEffect(() => {
    setLoading(true);
    calculateOnBackend(debouncedState)
      .then((nextResults) => {
        setResults(nextResults);
        setError('');
      })
      .catch((apiError: unknown) => {
        const message = apiError instanceof Error ? apiError.message : 'Hesaplama yapılamadı.';
        setError(message);
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, [debouncedState]);

  const yearRange = useMemo(() => {
    const observations = catalog?.series.flatMap((series) => series.observations) ?? [];
    const years = observations.map((item) => Number(item.date.slice(0, 4))).filter(Number.isFinite);
    const currentYear = Number(new Date().toISOString().slice(0, 4));

    return {
      min: years.length ? Math.min(...years) : 2000,
      max: Math.max(currentYear, years.length ? Math.max(...years) : currentYear),
    };
  }, [catalog]);

  const shareText = `Ne Kadar Ederdi? ${formatMoney(state.amount)}: ${formatMonth(state.startMonth)} → ${formatMonth(state.endMonth)}`;
  const shareUrl = window.location.href;

  function updateState(partial: Partial<CalculatorState>) {
    setState((current) => ({ ...current, ...partial }));
  }

  function toggleCriterion(key: SeriesKey) {
    setState((current) => {
      const exists = current.criteria.includes(key);
      const criteria = exists ? current.criteria.filter((item) => item !== key) : [...current.criteria, key];
      return { ...current, criteria: criteria.length ? criteria : ['tl'] };
    });
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="min-h-screen bg-paper-50 text-ink-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="grid gap-4 border-b border-ink-100 pb-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <Logo />
          <p className="max-w-2xl text-sm leading-6 text-ink-600 sm:justify-self-end sm:text-right">
            Geçmişteki ya da bugünkü bir TL tutarını TÜFE, döviz, altın, gümüş ve asgari ücretle ay bazında kıyaslayın.
          </p>
        </header>

        <AdSlot label="Reklam alanı" placement="top" />

        <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          <form
            className="h-fit rounded-md border border-ink-100 bg-white p-5 shadow-soft lg:sticky lg:top-5"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-ink-800">Miktar</span>
                <input
                  className="h-12 rounded-md border border-ink-200 bg-paper-50 px-4 font-data text-base text-ink-950 outline-none transition focus:border-oxide-700 focus:ring-4 focus:ring-oxide-100"
                  inputMode="decimal"
                  min="1"
                  type="number"
                  value={state.amount || ''}
                  onChange={(event) => updateState({ amount: Number(event.target.value) })}
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <MonthSelect
                  label="Başlangıç"
                  minYear={yearRange.min}
                  maxYear={yearRange.max}
                  value={state.startMonth}
                  onChange={(startMonth) => updateState({ startMonth })}
                />
                <MonthSelect
                  label="Bitiş"
                  minYear={yearRange.min}
                  maxYear={yearRange.max}
                  value={state.endMonth}
                  onChange={(endMonth) => updateState({ endMonth })}
                />
              </div>

              <fieldset className="grid gap-3">
                <legend className="text-sm font-semibold text-ink-800">Karşılaştırma</legend>
                <div className="grid grid-cols-2 gap-2">
                  {CRITERIA.map((criterion) => {
                    const selected = state.criteria.includes(criterion.key);

                    return (
                      <button
                        aria-pressed={selected}
                        className={`grid min-h-14 rounded-md border px-3 py-2 text-left transition ${
                          selected
                            ? 'border-oxide-800 bg-oxide-800 text-white'
                            : 'border-ink-200 bg-paper-50 text-ink-800 hover:border-ink-500'
                        }`}
                        key={criterion.key}
                        type="button"
                        onClick={() => toggleCriterion(criterion.key)}
                      >
                        <span className="flex items-center justify-between gap-2 text-sm font-bold">
                          {criterion.label}
                          {selected && <Check aria-hidden="true" size={16} />}
                        </span>
                        <span className={`text-xs ${selected ? 'text-oxide-50' : 'text-ink-500'}`}>
                          {criterion.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {state.startMonth < '2005-01' && (
                <p className="rounded-md bg-coin-50 p-3 text-sm leading-6 text-ink-800">
                  2005 öncesi girişlerde eski TL yeni TL'ye çevrilir; başlangıç tutarı 1.000.000'a bölünerek hesaplanır.
                </p>
              )}

              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-ink-950 px-4 text-base font-bold text-white transition hover:bg-ink-800"
                type="button"
                onClick={() => setState(defaultState())}
              >
                <RotateCcw aria-hidden="true" size={18} />
                Varsayılana dön
              </button>
            </div>
          </form>

          <section className="grid gap-4">
            <div className="rounded-md border border-ink-100 bg-white p-5 shadow-soft">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-data text-xs font-semibold uppercase text-oxide-700">Hesaplama özeti</p>
                  <h1 className="currency-value mt-2 font-data font-bold tracking-normal text-ink-950">
                    {formatMoney(state.amount || 0)}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-ink-600">
                    {formatMonth(state.startMonth)} tarihinden {formatMonth(state.endMonth)} tarihine göre.
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink-200 text-ink-700 transition hover:border-ink-500"
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    rel="noreferrer"
                    target="_blank"
                    title="X'te paylaş"
                  >
                    <XIcon />
                  </a>
                  <a
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink-200 text-ink-700 transition hover:border-ink-500"
                    href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                    rel="noreferrer"
                    target="_blank"
                    title="WhatsApp'ta paylaş"
                  >
                    <WhatsAppIcon />
                  </a>
                  <button
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink-200 text-ink-700 transition hover:border-ink-500"
                    title="Bağlantıyı kopyala"
                    type="button"
                    onClick={copyUrl}
                  >
                    {copied ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</p>}

            {loading && !error && (
              <div className="flex min-h-48 items-center justify-center rounded-md border border-ink-100 bg-white">
                <Loader2 className="animate-spin text-oxide-700" aria-hidden="true" size={28} />
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {results.map((result) => (
                  <ResultCard key={result.series.key} result={result} />
                ))}
              </div>
            )}

            {results.length > 0 && <AdSlot label="Sonuç altı reklam alanı" placement="results" />}

            <p className="rounded-md border border-ink-100 bg-white p-4 text-xs leading-5 text-ink-500">
              Bu araç resmi ve güvenilir tarihsel kaynaklardan derlenen aylık verilerle yaklaşık kıyaslama sunar; yatırım tavsiyesi değildir.
            </p>
          </section>
        </section>

        <section
          aria-labelledby="seo-heading"
          className="grid gap-4 border-t border-ink-100 pt-6 text-sm leading-6 text-ink-600 md:grid-cols-3"
        >
          <div className="md:col-span-3">
            <h2 id="seo-heading" className="font-display text-xl font-black leading-tight text-ink-950">
              Geçmişteki para değerini karşılaştırma
            </h2>
          </div>
          <article className="rounded-md border border-ink-100 bg-white p-4">
            <h3 className="font-semibold text-ink-900">Enflasyona göre TL değeri</h3>
            <p className="mt-2">
              TÜFE serisi, geçmişteki bir TL tutarının bugünkü yaklaşık satın alma gücünü görmek için kullanılır.
            </p>
          </article>
          <article className="rounded-md border border-ink-100 bg-white p-4">
            <h3 className="font-semibold text-ink-900">Döviz ve değerli maden kıyası</h3>
            <p className="mt-2">
              Dolar, euro, gram altın ve gümüş karşılaştırmaları aylık veri serileri üzerinden yaklaşık çarpan üretir.
            </p>
          </article>
          <article className="rounded-md border border-ink-100 bg-white p-4">
            <h3 className="font-semibold text-ink-900">Asgari ücretle karşılaştırma</h3>
            <p className="mt-2">
              Net asgari ücret serisi, belirli bir tutarın dönemsel gelir düzeyleriyle kıyaslanmasına yardımcı olur.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}

function XIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 2h3.1l-6.8 7.8 8 12.2h-6.3l-4.9-7.1-5.6 7.1H3.3l7.3-8.4L3 2h6.4l4.4 6.5L18.9 2Zm-1.1 17.9h1.7L8.5 4H6.7l11.1 15.9Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2a9.88 9.88 0 0 0-8.5 14.92L2.4 22l5.2-1.08A9.93 9.93 0 1 0 12.04 2Zm0 1.86a8.06 8.06 0 0 1 6.82 12.37 8.06 8.06 0 0 1-10.78 2.8l-.37-.22-3.05.64.65-2.98-.25-.39a8.06 8.06 0 0 1 6.98-12.22Zm-3.1 4.25c-.18 0-.46.07-.7.34-.25.27-.92.9-.92 2.2 0 1.29.94 2.54 1.07 2.72.13.18 1.82 2.91 4.5 3.97 2.23.88 2.68.7 3.16.66.49-.04 1.57-.64 1.8-1.26.22-.62.22-1.15.15-1.26-.06-.11-.24-.18-.5-.31-.27-.13-1.57-.78-1.81-.86-.25-.09-.42-.13-.6.13-.18.27-.69.86-.85 1.04-.16.18-.31.2-.58.07-.27-.13-1.12-.41-2.14-1.31-.79-.7-1.32-1.57-1.47-1.84-.16-.27-.02-.41.12-.54.12-.12.27-.31.4-.47.14-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.6-1.46-.82-2-.22-.52-.44-.45-.6-.46l-.52-.01Z" />
    </svg>
  );
}

export default App;
