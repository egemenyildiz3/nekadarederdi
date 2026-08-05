import { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Share2 } from 'lucide-react';
import { AdSlot } from './components/AdSlot';
import { ResultCard } from './components/ResultCard';
import { calculateOnBackend, fetchSeries } from './lib/api';
import { defaultState, parseStateFromUrl, stateToSearchParams } from './lib/calculator';
import { formatMoney, formatMonth } from './lib/format';
import type { CalculationResult, CalculatorState, SeriesKey } from './types';

const CRITERIA: { key: SeriesKey; label: string }[] = [
  { key: 'cpi', label: 'TÜFE' },
  { key: 'usd', label: 'USD' },
  { key: 'eur', label: 'EUR' },
  { key: 'gold', label: 'Altın' },
  { key: 'minimumWage', label: 'Asgari Ücret' },
  { key: 'silver', label: 'Gümüş' },
];

function App() {
  const [state, setState] = useState<CalculatorState>(() => parseStateFromUrl(window.location.search));
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSeries()
      .then((catalog) => setUpdatedAt(catalog.updatedAt))
      .catch(() => setError('Veri listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.'));
  }, []);

  useEffect(() => {
    const nextUrl = `${window.location.pathname}?${stateToSearchParams(state)}`;
    window.history.replaceState(null, '', nextUrl);
  }, [state]);

  useEffect(() => {
    if (state.endMonth < state.startMonth) {
      setResults([]);
      return;
    }

    setLoading(true);
    calculateOnBackend(state)
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
  }, [state]);

  const hasInvalidDateRange = state.endMonth < state.startMonth;
  const shareText = `Ne Kadar Ederdi? ${formatMoney(state.amount)} (${formatMonth(state.startMonth)}) için hesaplama`;
  const shareUrl = window.location.href;

  function updateState(partial: Partial<CalculatorState>) {
    setState((current) => ({ ...current, ...partial }));
  }

  function toggleCriterion(key: SeriesKey) {
    setState((current) => {
      const exists = current.criteria.includes(key);
      const criteria = exists ? current.criteria.filter((item) => item !== key) : [...current.criteria, key];
      return { ...current, criteria };
    });
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="min-h-screen bg-stone-50 text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">nekadarederdi.net</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              Ne Kadar Ederdi?
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Geçmişteki bir TL tutarını TÜFE, döviz, altın, gümüş ve asgari ücretle sade biçimde kıyaslayın.
          </p>
        </header>

        <AdSlot label="Reklam alanı" />

        <section className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <form className="rounded-md border border-slate-200 bg-white p-5 shadow-soft" onSubmit={(event) => event.preventDefault()}>
            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Miktar</span>
                <input
                  className="h-12 rounded-md border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  inputMode="decimal"
                  min="1"
                  type="number"
                  value={state.amount}
                  onChange={(event) => updateState({ amount: Number(event.target.value) })}
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Başlangıç</span>
                  <input
                    className="h-12 rounded-md border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    type="month"
                    value={state.startMonth}
                    onChange={(event) => updateState({ startMonth: event.target.value })}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Bitiş</span>
                  <input
                    className="h-12 rounded-md border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    type="month"
                    value={state.endMonth}
                    onChange={(event) => updateState({ endMonth: event.target.value })}
                  />
                </label>
              </div>

              <fieldset className="grid gap-3">
                <legend className="text-sm font-medium text-slate-700">Karşılaştırma</legend>
                <div className="grid grid-cols-2 gap-2">
                  {CRITERIA.map((criterion) => {
                    const selected = state.criteria.includes(criterion.key);

                    return (
                      <button
                        aria-pressed={selected}
                        className={`flex h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
                          selected
                            ? 'border-emerald-700 bg-emerald-700 text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                        }`}
                        key={criterion.key}
                        type="button"
                        onClick={() => toggleCriterion(criterion.key)}
                      >
                        {selected && <Check aria-hidden="true" size={16} />}
                        {criterion.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {state.startMonth < '2005-01' && (
                <p className="rounded-md bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                  2005 öncesi girişlerde eski TL otomatik olarak yeni TL'ye çevrilir; tutar 1.000.000'a bölünerek hesaplanır.
                </p>
              )}

              {hasInvalidDateRange && (
                <p className="rounded-md bg-red-50 p-3 text-sm leading-6 text-red-700">
                  Bitiş tarihi başlangıç tarihinden önce olamaz.
                </p>
              )}

              <button
                className="h-12 rounded-md bg-slate-950 px-4 text-base font-semibold text-white transition hover:bg-slate-800"
                type="button"
                onClick={() => setState(defaultState())}
              >
                Varsayılana dön
              </button>
            </div>
          </form>

          <section className="grid gap-4">
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Hesaplama özeti</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
                    {formatMoney(state.amount)} / {formatMonth(state.startMonth)} - {formatMonth(state.endMonth)}
                  </h2>
                </div>
                <div className="flex gap-2">
                  <a
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:border-slate-500"
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    rel="noreferrer"
                    target="_blank"
                    title="X'te paylaş"
                  >
                    <Share2 aria-hidden="true" size={18} />
                  </a>
                  <a
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:border-slate-500"
                    href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                    rel="noreferrer"
                    target="_blank"
                    title="WhatsApp'ta paylaş"
                  >
                    <Share2 aria-hidden="true" size={18} />
                  </a>
                  <button
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:border-slate-500"
                    title="Bağlantıyı kopyala"
                    type="button"
                    onClick={copyUrl}
                  >
                    {copied ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
                  </button>
                </div>
              </div>
              {updatedAt && <p className="mt-4 text-sm text-slate-500">Veri dosyası tarihi: {updatedAt}</p>}
            </div>

            {error && <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</p>}

            {loading && !error && (
              <div className="flex min-h-48 items-center justify-center rounded-md border border-slate-200 bg-white">
                <Loader2 className="animate-spin text-emerald-700" aria-hidden="true" size={28} />
              </div>
            )}

            {!loading && !hasInvalidDateRange && results.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {results.map((result) => (
                  <ResultCard key={result.series.key} result={result} />
                ))}
              </div>
            )}

            {results.length > 0 && <AdSlot label="Sonuç altı reklam alanı" />}
          </section>
        </section>
      </div>
    </main>
  );
}

export default App;
